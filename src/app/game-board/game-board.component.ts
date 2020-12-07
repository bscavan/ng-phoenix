import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { COLS, BLOCK_SIZE, ROWS, PLAYER_LAYER } from '../constants';
import { Piece } from './piece';
import { GameService } from '../game-service';
import { KeyCodes } from './KeyCodes';
import { IPiece } from './IPiece';
import { Point, ShipPiece, Highwind, BlockHead } from './ship-piece';
import { isNull } from 'util';
import { CustomCanvas } from './custom-canvas';
import { GameObject } from './game-object';

@Component({
  selector: 'game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  // Get reference to the canvas.
  @ViewChild('board', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  gameCanvas: CustomCanvas;
  points: number;
  lines: number;
  level: number;
  //board: number[][];
  //piece: Piece;
  ship: ShipPiece;
  startPosition: Point = new Point(5, 2);

  // The key is the layer each GameObject[] resides on. Higher layers are drawn later, meaning they can cover up lower ones.
  public allGameItems: Map<number, GameObject[]> = new Map<number, GameObject[]>();

  /*
  moves = {
    [KeyCodes.LEFT]:  (p: IPiece): IPiece => ({ ...p, x: p.x - 1 }),
    [KeyCodes.RIGHT]: (p: IPiece): IPiece => ({ ...p, x: p.x + 1 }),
    [KeyCodes.UP]:    (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KeyCodes.DOWN]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
  };
  */

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.initBoard();
  }

  initBoard() {
    // Get the 2D context that we draw on.
    this.gameCanvas = new CustomCanvas(this.canvas.nativeElement.getContext('2d'));

    // Calculate size of canvas from constants.
    //this.gameCanvas.canvas.width = COLS * BLOCK_SIZE;
    this.gameCanvas.setWidth(COLS * BLOCK_SIZE);
    //this.gameCanvas.canvas.height = ROWS * BLOCK_SIZE;
    this.gameCanvas.setHeight(ROWS * BLOCK_SIZE);

    // Scales up the canvas so that each pixel is shown as a full block.
    this.gameCanvas.scale(BLOCK_SIZE, BLOCK_SIZE);
  }

  play() {
    //.board = this.gameService.getEmptyBoard(ROWS, COLS);
    //this.piece = new Piece(this.gameCanvas);
    //this.piece.draw();

    // TODO: Make a point named startPosition where the ship will begin
    // TODO: Make a basic ship (named Highwind) that extends ShipPiece and has a shape.
    //this.ship = new ShipPiece(this.gameCanvas, startPosition)
    this.ship = new Highwind(this.startPosition);
    this.addGameObject(this.ship, PLAYER_LAYER);

    // TODO: Come up with a registry of items that have behaviors. Each tick update their position based on those.
    // Most enemy ships should loop through actions (flying in formation) with only later ones actually tracking the player.
    let firstBlockhead = new BlockHead(new Point(0, 0));
    this.addGameObject(firstBlockhead, 1);

    //this.gameCanvas.draw(this.ship);
    this.redrawCanvas();
  }

  addGameObject(newPiece: GameObject, layer: number) {
    // If the mentioned layer doesn't exist, add it with newPiece being the only thing on it.
    if(this.allGameItems.has(layer) == false) {
      this.allGameItems.set(layer, [newPiece]);
    } else {
      let currentLayer: GameObject[] = this.allGameItems.get(layer);
      let indexOfPiece = currentLayer.indexOf(newPiece);

      // If the GameObject doesn't already exist on this layer, add it.
      if(indexOfPiece < 0) {
        currentLayer.push(newPiece);
      }
    }
  }

  removeGameObject(targetPiece: GameObject, layer: number) {
    if(this.allGameItems.has(layer)) {
      let currentLayer: GameObject[] = this.allGameItems.get(layer);
      let indexOfPiece = currentLayer.indexOf(targetPiece);

      // If targetPiece does exist on this layer, remove it.
      if(indexOfPiece >= 0) {
        currentLayer.slice(indexOfPiece, 1);
      }
    }
  }

  removeGameObjectLayer(layer: number) {
    this.allGameItems.delete(layer);
  }

  /*
   * 
   * TODO: Refactor this to only update a value for tracking the player's last input.
   * All of the real logic will be migrated out of here and into a method that
   * gets called each time the game's Clock updates (each tic).
   */
  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {

    /*
    if (this.moves[event.keyCode]) {
      // If the keyCode exists in our moves stop the event from bubbling.
      event.preventDefault();
      // Get the next state of the piece.
      const p = this.moves[event.keyCode](this.piece);
      // Move the piece
      this.piece.move(p);
      // Clear the old position before drawing
      this.gameCanvas.clearRect(0, 0, this.gameCanvas.canvas.width, this.gameCanvas.canvas.height);
      // Draw the new position.
      this.piece.draw();
    }
    */

    let newPoint: Point = null;

    // This can be modified with a "speed" multiplier
    let moveStep = 1;
    let currentPosition = this.ship.upperLeftCorner;

    switch(event.keyCode) {
      // TODO: event.preventDefault();
      case KeyCodes.LEFT:
        newPoint = new Point(currentPosition.xCoordinate - moveStep, currentPosition.yCoordinate);
        break;

      case KeyCodes.RIGHT:
        newPoint = new Point(currentPosition.xCoordinate + moveStep, currentPosition.yCoordinate);
        break;

      case KeyCodes.UP:
        newPoint = new Point(currentPosition.xCoordinate, currentPosition.yCoordinate - moveStep);
        break;

      case KeyCodes.DOWN:
        newPoint = new Point(currentPosition.xCoordinate, currentPosition.yCoordinate + moveStep);
        break;
    }

    // TODO: Move the other items in the world here, enemy ships, projectiles, etc.

    // TODO: Iterate over the other items on the ship's layer and confirm there won't be any collisions!

    if(isNull(newPoint) == false) {
      /*
      this.gameCanvas.erase(this.ship);

      this.ship.moveToPoint(newPoint);

      this.gameCanvas.draw(this.ship);
      */
      this.ship.moveToPoint(newPoint);
      this.redrawCanvas();
    }
  }



  /*
   * TODO: Call this method once each tick of the Clock.
   * TODO: In the method that calls this one, grab the value of a variable that
   * is updated (blindly) based on the user's keyboard/controller input. That
   * value is updated whenever the inputs change, but only read once per tick.
   * That way, regardless of how long in real time each tick is, we will only
   * let the player get one action per tick. (Holding down the left key won't
   * let them move their piece any faster than pressing it once per tick.)
   */
  redrawCanvas() {
    /**
     * TODO: Iterate over a list of GameObjects, drawing each one on the board.
     * The order in which they are drawn needs to be determined by a "layer"
     * value.
     * Ergo, I need a collection of GameObjects and each one needs to have a score for what layer it goes on.
     * This class will need to handle all collision checking, moving, etc.
     */

    this.gameCanvas.clearCanvas();

    // TODO: confirm this will iterate over the lists in ascending order.
    this.allGameItems.forEach((currentObjectList: GameObject[]) => {
      currentObjectList.forEach((currentObject: GameObject) => {
        this.gameCanvas.draw(currentObject);
      })
    });
  }
}