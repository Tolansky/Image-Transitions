/// <reference path="jquery.d.ts" />
console.clear();




//////////////////////////////////
// CLASS DEFINITIONS
//////////////////////////////////

class TransitionObject
{
  index: number = 0;  
  images: string[];
  imageClass: string;
  width: number;
  height: number;
  imgWidths: number[];
  imgHeights: number[];
  ctx;
    
  start()
  {
    this.index = 0;
    nextPicture(this.ctx, ANIMATION.FADE, this.width, this.height, this.imgWidths[0],
                this.imgHeights[0], this.images[0], this.images[0], 1,1, 1, now());
  }
  
  refresh()
  {
    var imagesToLoad = document.getElementsByClassName(this.imageClass);
    for(var i = 0; i < imagesToLoad.length; i++)
    {
      var o = imagesToLoad.item(i)
      this.images[i] = $(o).attr('src');
      this.imgWidths[i] = parseInt($(o).css("width").replace("px",""));
      this.imgHeights[i] = parseInt($(o).css("height").replace("px",""));
    }
  }
  
  next(animationType, newCols = 5, newRows = 5, totalTime = 2000, startTime = now())
  {
    var nextPic = (this.index + 1) % this.images.length;
    nextPicture(this.ctx,
                animationType,
                this.width,
                this.height,
                this.imgWidths[this.index],
                this.imgHeights[this.index],
                this.images[this.index],
                this.images[nextPic],
                newCols,
                newRows,
                totalTime,
                startTime);
    this.index = nextPic;
  }
}

class pos
{
  x: number;
  y: number;
}


class square
{
  //this specific box (count, starting at zero)
  x: number;
  y: number;  
  
  //true across all boxes
  canvasWidth: number;
  canvasHeight: number;
  width:number;
  height:number;
  imagePath: string;
  originalWidth: number;  
  originalHeight: number;  
  xCount: number;
  yCount: number;
  xOffset: number;
  yOffset: number;
  left: number;
  top: number;
  opacity: number;
  
  
  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, imagePath: string, originalWidth: number, originalHeight: number, xCount = 4, yCount = 4, xOffset = 0, yOffset = 0, opacity = 1)
  {
    //taken directly
    this.x = x;
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.imagePath = imagePath ;
    this.originalWidth = originalWidth;
    this.originalHeight = originalHeight;
    this.xCount = xCount ;
    this.yCount = yCount;
    this.xOffset = originalWidth/xCount * x;
    this.yOffset = originalHeight/yCount * y;    
    this.opacity = opacity;
  
    //calculated
    this.left = canvasWidth/xCount * x;        
    this.top = canvasHeight/yCount * y;
    this.width = canvasWidth/xCount;
    this.height = canvasHeight/yCount;  
  }
  
  draw(ctx)
  {    
    //Reading from original image
    var imageObj2 = new Image();    
    var sx = this.xOffset;
    var sy = this.yOffset;
    var sWidth = this.originalWidth/this.xCount;
    var sHeight = this.originalHeight/this.yCount;
  
    //Positioning                          
  
    var width = this.width;
    var height = this.height;
    var left = this.left;
    var top = this.top;
    var opacity = this.opacity;
    imageObj2.src = this.imagePath;
  
  
    if (opacity != 1)
    {
      ctx.globalAlpha = opacity;
    }
  
    ctx.drawImage(imageObj2,sx,sy,sWidth,sHeight,left,top,width,height);       
  
    if (opacity != 1)
    {
      ctx.globalAlpha = 1;
    }
  
  
  }
}


class grid
{
  rows: number;
  columns: number;
  squares: square[][] = [[],[]];
  list: square[] = [];
  opacity: number;
  count:number;
  file:string;
  newWidth:number;
  newHeight:number;
  originalWidth:number;
  originalHeight:number;
  ctx;
  
  constructor( newWidth, newHeight, originalWidth, originalHeight, columns, rows,file, ctx, opacity = 1)
  {    
    this.rows = rows;
    this.columns = columns;
    this.ctx = ctx;
    this.opacity = opacity;
    this.count = rows * columns;
    this.file = file;
    this.newWidth = newWidth;
    this.newHeight = newHeight;
    this.originalHeight = originalHeight;
    this.originalWidth = originalWidth;
    this.buildSquares();
  }
  
  buildSquares()
  {
    this.list = [];
    for (var x = 0; x < this.columns; x++)
    {
      this.squares[x] = [];
      for (var y = 0; y < this.rows; y++)
      {        
        var sq = new square(x, y, this.newWidth, this.newHeight, this.file, this.originalWidth, this.originalHeight, this.columns, this.rows, this.opacity);
        this.squares[x][y] = sq;
        this.list[this.list.length] = sq;
      }    
    }    
  }
  
  draw(secondGrid = null)
  {
    for (var x = 0; x < this.columns; x++)
    {
      for (var y = 0; y < this.rows; y++)
      {        
        var sq = this.squares[x][y];
        sq.draw(this.ctx);
      }
    }
  }
}


//////////////////////////////////
// CUSTOM ANIMATION
//////////////////////////////////

//Options
enum ANIMATION
{
  FALL = 0,
  SLIDE = 1,
  FADE = 2,
  COLUMNS = 3,
  RANDOMCOLUMNS = 4,
  SPLICE = 5,
  EXPLODE = 6,
  IMPLODE = 7,
  SHRINKRANDOM = 8,
  SHRINKHORIZONTAL = 9,
  SHRINKVERTICAL = 10,
  DROP = 11,
  BUILD = 12,
  VCROSSFADE = 13,
  HCROSSFADE = 14,
  SPLICE2 = 15
}

//The function itself!
function nextPicture(ctx, animationType, width, height, originalWidth, originalHeight, oldFile, newFile, newCols = 5, newRows = 5, totalTime = 2000, startTime = now(), firstRun = 1, randomStorage = [])
{  
  //Time calculations
  var delta = now() - startTime;      // time progressed so far
  var per = delta/totalTime;          // fraction (percentage) of way through total animation time


  //Cols for the grids
  var colsForNewGrid = 1;
  var rowsForNewGrid = 1;
  var colsForOldGrid = newCols;
  var rowsForOldGrid = newRows;

  var redraw = false;

  var reverseDraw = false;
  if (animationType == ANIMATION.BUILD)
  {
    reverseDraw = true;
    colsForNewGrid = newCols;
    rowsForNewGrid = newRows;
    colsForOldGrid = 1;
    rowsForOldGrid = 1;

  }

  
  //setup the new image first (to be drawn over in a moment) - HULK
  var newGrid = new grid(width, height, originalWidth, originalHeight, colsForNewGrid, rowsForNewGrid, newFile, ctx);

  //write the old image on top (which is going to animate itself away) - ENTERPRISE
  var oldGrid = new grid(width, height, originalWidth, originalHeight, colsForOldGrid, rowsForOldGrid, oldFile,ctx);

  //Do whatever you're going to do to the old image
  switch (animationType)
  {
      ////////////////////////////////////////////////////////////////
      //Set top based on current percentage
    case ANIMATION.FALL:        

      var offset = height * smooth(per);
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        oldGrid.list[i].top += offset;    
      }      
      if (offset > 0)
      {          
        redraw = true;
      }
      break;

      ////////////////////////////////////////////////////////////////
      //Set left based on current percentage
    case ANIMATION.SLIDE:                  
      var offset = width * smooth(per);
      for (var i = 0; i < oldGrid.count; i++)
      {
        oldGrid.list[i].left -= offset;    
      }   
      if (offset > 0)
      {          
        redraw = true;        
      }
      break;

    ////////////////////////////////////////////////////////////////
    //Set opacity based on current percentage
    case ANIMATION.FADE:
      var x = -1;
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var newPer = Math.max(1 - (smooth(per)),0);              
        oldGrid.list[i].opacity = newPer;          
        if (x != newPer)
        {
          x = newPer;
          redraw = true;
        }
      }                          
      break;


      ////////////////////////////////////////////////////////////////
      //Set opacity & top for each column
    case ANIMATION.COLUMNS:
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        var startingTime = (totalTime * (sq.x/oldGrid.columns)/2);            
        var rPer = Math.max((delta - startingTime)/(totalTime/2),0)            
        var offset = height * smooth(rPer);            

        sq.top += offset;       
        sq.yOffset += offset;
        sq.opacity = 1 - rPer;   

        if (x != rPer && redraw == false)
        {
          x = rPer;
          redraw = true;
        }
      }   


      break;


      ////////////////////////////////////////////////////////////////
      //Set opacity & top for each column, randomly!
    case ANIMATION.RANDOMCOLUMNS:

      //randomise (once)
      if (firstRun)
      {
        randomStorage = shuffleNumber(oldGrid.columns);          
      }

      //run much like columns, but referring to the random order
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        var startingTime = (totalTime * (randomStorage[sq.x]/oldGrid.columns)/2);            
        var rPer = Math.max((delta - startingTime)/(totalTime/2),0)            
        var offset = height * smooth(rPer);            

        sq.top += offset;                  
        sq.yOffset += offset;
        sq.opacity = 1 - rPer;

        if (x != rPer && redraw == false)
        {
          x = rPer;
          redraw = true;
        }
      }                                 
      break;

      ////////////////////////////////////////////////////////////////
      //Set opacity & top for each column, one up one down
    case ANIMATION.SPLICE:
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        var startingTime = (totalTime * (sq.x/oldGrid.columns)/2);            
        var rPer = Math.max((delta - startingTime)/(totalTime/2),0)            
        var offset = height * smooth(rPer);            

        if (sq.x%2==0)
        {
          sq.top += offset; 
          sq.yOffset += offset;
        }
        else
        {
          sq.top -= offset;    
          sq.yOffset -= offset;
        }
        sq.opacity = 1 - rPer;

        if (x != rPer && redraw == false)
        {
          x = rPer;
          redraw = true;
        }
      }        
      break;




    case ANIMATION.SPLICE2:
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        var startingTime = (totalTime * (sq.x/oldGrid.columns)/2);            
        var rPer = Math.max((delta - startingTime)/(totalTime/2),0)            
        var offset = height * smooth(rPer);            

        if (sq.x%2==0)
        {
          sq.top += offset; 
          sq.yOffset += offset;
        }
        else
        {
          sq.top -= offset;    
          sq.yOffset -= offset;
        }
        if (x != rPer && redraw == false)
        {
          x = rPer;
          redraw = true;
        }

      }        
      break;

      ////////////////////////////////////////////////////////////////
      //Each cell moves away from the centre
    case ANIMATION.EXPLODE:     
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        oldGrid.list[i].top += (sq.canvasHeight/oldGrid.rows * (sq.y - ((oldGrid.rows-1)/2))) * smooth(per);
        oldGrid.list[i].left += (sq.canvasWidth/oldGrid.columns * (sq.x - ((oldGrid.columns-1)/2))) * smooth(per);
        oldGrid.list[i].opacity = 1 - smooth(per);


      }    
      if (x != per && redraw == false)
      {
        x = per;
        redraw = true;
      }
      break;

      ////////////////////////////////////////////////////////////////
      //Each cell moves towards the centre
    case ANIMATION.IMPLODE:     
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];
        sq.top -= (sq.canvasHeight/oldGrid.rows * (sq.y - ((oldGrid.rows-1)/2))) * smooth(per);
        sq.left -= (sq.canvasWidth/oldGrid.columns * (sq.x - ((oldGrid.columns-1)/2))) * smooth(per);
        sq.width = (sq.canvasWidth/sq.xCount) * (1 - smooth(per))
        sq.height = (sq.canvasHeight/sq.yCount) * (1 - smooth(per))

        sq.opacity = 1 - per;
      }        
      if (x != per && redraw == false)
      {
        x = per;
        redraw = true;
      }
      break;


      ////////////////////////////////////////////////////////////////
      //Each cell shrinks itself randomly (FALLS THROUGH)
    case ANIMATION.SHRINKRANDOM:           
      if (firstRun)
      {
        //generate a random order for the squares
        randomStorage = shuffleNumber(oldGrid.count);      
      }

      ////////////////////////////////////////////////////////////////
      //Each cell shrinks itself horizontally (FALLS THROUGH)
    case ANIMATION.SHRINKHORIZONTAL:      

      ////////////////////////////////////////////////////////////////
      //Each cell moves away from the centre
    case ANIMATION.SHRINKVERTICAL:     
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];

        var delay = 0;
        switch (animationType)
        {
          case ANIMATION.SHRINKRANDOM:
            delay = (totalTime/2)/oldGrid.count*randomStorage[i];
            break;
          case ANIMATION.SHRINKVERTICAL:
            var delay = (totalTime/2)/oldGrid.rows*sq.y;
            break;
          case ANIMATION.SHRINKHORIZONTAL:
            var delay = (totalTime/2)/oldGrid.columns*sq.x;
            break;
        }

        //new percentage; using delayed delta and half total time (capped between 0 and 1)
        var per2 = smooth(Math.max(Math.min((delta-delay)/(totalTime/2),1),0));

        //even split width + inverse percentage
        sq.width =  (sq.canvasWidth/sq.xCount) * (1-per2);
        sq.height =  (sq.canvasHeight/sq.yCount) * (1-per2);

        //even split width (times location) + even split width times percentage
        sq.left = (sq.canvasWidth/sq.xCount * sq.x) + (((sq.canvasWidth/sq.xCount)/2) * per2);        
        sq.top = (sq.canvasHeight/sq.yCount * sq.y) + (((sq.canvasHeight/sq.yCount)/2) * per2);

        if (x != per2 && redraw == false)
        {
          x = per2;
          redraw = true;
        }
      }       
      break;



      ////////////////////////////////////////////////////////////////
      //Squares randomly drop away
    case ANIMATION.DROP: 
      if (firstRun)
      {
        //generate a random order for the squares
        randomStorage = shuffleNumber(oldGrid.count);      
      }
      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];        
        var delay = (totalTime/2)/oldGrid.count*randomStorage[i];        
        var per2 = smooth(Math.max(Math.min((delta-delay)/(totalTime/2),1),0));
        sq.top += (sq.canvasHeight * 1.5) * per2;     
        if (x != per2 && redraw == false)
        {
          x = per2;
          redraw = true;
        }
      }       
      break;

      ////////////////////////////////////////////////////////////////
      //Squares build from the center
    case ANIMATION.BUILD:     
      reverseDraw = true;
      for (var i = 0; i < newGrid.list.length; i++)
      {
        var sq = newGrid.list[i];        

        var ct = (sq.y * sq.xCount) + sq.x;             // do it like reading book (top row left to right, then second, etc)
        var delay = (totalTime/2)/newGrid.count * ct;

        var per2 = smooth(Math.max(Math.min((delta-delay)/(totalTime/2),1),0));

        //grow from nothing
        sq.width = (sq.canvasWidth/sq.xCount) * (per2);
        sq.height = (sq.canvasHeight/sq.yCount) * (per2);

        // starts at middle, as % -> 1 the two "middle location"s cancel each other out
        //        middle location    + (  %  * (eventual location                   - middle location   ))
        sq.left = (sq.canvasWidth/2) + (per2 * ((sq.canvasWidth / sq.xCount * sq.x) - (sq.canvasWidth/2)))        
        sq.top = (sq.canvasHeight/2) + (per2 * ((sq.canvasHeight / sq.yCount * sq.y) - (sq.canvasHeight/2)))     

        if (x != per2 && redraw == false)
        {
          x = per2;
          redraw = true;
        }
      }       
      break;

      ////////////////////////////////////////////////////////////////
      //FADES IN FROM THE TOP
    case ANIMATION.VCROSSFADE: 

      for (var i = 0; i < oldGrid.list.length; i++)
      {
        var sq = oldGrid.list[i];        
        var delay = (totalTime/2)/sq.yCount*sq.y;        
        var per2 = smooth(Math.max(Math.min((delta-delay)/(totalTime/2),1),0));
        sq.opacity = (1-per2);     

        if (x != per2 && redraw == false)
        {
          x = per2;
          redraw = true;
        }
      }       
      break;

      ////////////////////////////////////////////////////////////////
      //FADES IN FROM THE LEFT
    case ANIMATION.HCROSSFADE:      
      for (var i = 0; i < oldGrid.count; i++)
      {
        var sq = oldGrid.list[i];        
        var delay = (totalTime/2)/sq.xCount*(oldGrid.columns - sq.x);        
        var per2 = smooth(Math.max(Math.min((delta-delay)/(totalTime/2),1),0));
        sq.opacity = (1-per2);   

        if (x != per2 && redraw == false)
        {
          x = per2;
          redraw = true;
        }
      }       
      break;
      
  
      ////////////////////////////////////////////////////////////////
      //What to do??
    default:
      console.log("UNKNOWN ANIMATION TYPE");
      break;
  }

  if (redraw)
  {
    //then draw the old new followed by the old
    if (reverseDraw)
    {
      oldGrid.draw();
      newGrid.draw();
    }
    else
    {
      newGrid.draw();
      oldGrid.draw();
    }
  }



  //Recursively call the animation function
  if (per < 1 || totalTime < 0)
  {
    requestAnimationFrame(function()
                          {      
      nextPicture(ctx, animationType, width, height, originalWidth, originalHeight, oldFile,newFile, newCols, newRows, totalTime, startTime, 0, randomStorage)  
    }); 
  }
  else
  {
    //FINALISE - just left with the new image (cleaner, guarantees good remains)
    ctx.clearRect(0,0,width,height);     
    var newGrid = new grid(width, height, originalWidth, originalHeight, 1, 1, newFile, ctx);
    newGrid.draw();
  }
}




///////////////////////
// HELPER FUNCTIONS
///////////////////////

function smooth(t)
{
  //Credit to https://gist.github.com/gre/1650294 for this equation
  var toReturn =  t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  toReturn = Math.max(toReturn,0);
  toReturn = Math.min(toReturn,1);
  return toReturn;  
};

function getOffset(angle,rad)
{      
  angle = d2r(angle);

  var x = Math.cos(angle) * rad;
  var y = Math.sin(angle) * rad;    

  var pos = new pos();
  pos.x = (x);
  pos.y = (y);
  return pos;
}

function r2d(n)
{
  return n / (2 * Math.PI) * 360;
}
function d2r(n)
{
  return n / 360 * (2 * Math.PI);
}

function shuffleNumber(n)
{
  var arr = [];
  for (var i = 0; i < n; i++)
  {
    arr[i] = i;
  }
  return shuffle(arr);
}

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function clog(s)
{
  console.log(s);
}

function now()
{
  return new Date().getTime();
}







/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// JQUERY PLUGIN
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
(function ( $ ) 
{
   $.fn.transitionObject = function( options )
  {
    var settings = $.extend(
      {
        imageClass: 'imageClass',
        width:800,
        height:600
      }, options );
    
      
    //Assign the images to an array to pass in in a moment
    var images = [];
    var originalWidths = [];
    var originalHeights = [];
    
    var imagesToLoad = document.getElementsByClassName(settings.imageClass);
    for(var i = 0; i < imagesToLoad.length; i++)
    {
      var o = imagesToLoad.item(i)
       images[i] = $(o).attr('src');
       originalWidths[i] = parseInt($(o).css("width").replace("px",""));
       originalHeights[i] = parseInt($(o).css("height").replace("px",""));
    }
        
    
    //Build the Transition Object
    var tr = new TransitionObject();
    tr.imageClass = settings.imageClass;
    tr.width = settings.width;              // width
    tr.height = settings.height;            // height
    tr.ctx = this[0].getContext("2d");      // canvas object (2d)
    tr.images = images;                     // images array built above
    tr.imgWidths = originalWidths;          // array of original image widths
    tr.imgHeights = originalHeights;        // array of original image heights
    tr.start();                             // kick off with the first image
    return tr;                              // return the transition object
  }
    
}( jQuery ));