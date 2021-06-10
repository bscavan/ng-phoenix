import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { COLS, BLOCK_SIZE, ROWS, PLAYER_LAYER } from '../constants';
import { GameService } from '../game-service';
import { KeyCodes } from './KeyCodes';
import { Point, ShipPiece, Highwind, BlockHead } from './ship-piece';
import { isNull } from 'util';
import { CustomCanvas } from './custom-canvas';
import { GameObject, Movement } from './game-object';
import { AxisAlignedBoundingBox, IntersectionUtility } from '../intersection-utility';

export const MILLISECONDS_PER_WORLD_TICK = 1000;

@Component({
  selector: 'game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  // TODO: Make a way of running a reverse-lookup for coordinates? To see what, if anything, exists at a point.
  /**
   * TODO: Add a second canvas to this class. All "draw" commands are executed
   * on the "secondary" canvas, and then after they've all been finished, it is
   * swapped with "primary" canvas, which becomes the new secondary one. This
   * will cause all visual updates to occur at the same time instead of
   * sequentially.
   */

  // Get reference to the canvas.
  @ViewChild('board', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  gameCanvas: CustomCanvas;
  points: number;
  lines: number;
  level: number;
  ship: ShipPiece;
  startPosition: Point = new Point(5, 2);

  // TODO: Remove these once collision detection has been confirmed to work...
  enemy: GameObject;
  shipsMightIntersect = false;
  playerShipLocation = "";
  enemyShipLocation = "";

  /**
   * This is the reference for the interval responsible for tracking real time
   * and scheduling all actions in the game.
   */
  private gameClockId;

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
    this.initCanvas();
  }

  startGameClock() {
    this.gameClockId = setInterval(() => {
      // These are the actions that are executed 
      this.executeWorldTick();
      this.redrawCanvas();
    }, MILLISECONDS_PER_WORLD_TICK);
  }

  ngOnDestroy() {
    if (this.gameClockId) {
      clearInterval(this.gameClockId);
    }
  }

  initCanvas() {
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

  // TODO: Rename this method.
  play() {
    this.startGameClock();
    this.ship = new Highwind(this.startPosition);
    this.addGameObject(this.ship, PLAYER_LAYER);

    // TODO: Come up with a registry of items that have behaviors. Each tick update their position based on those.
    // Most enemy ships should loop through actions (flying in formation) with only later ones actually tracking the player.
    let firstBlockhead = new BlockHead(new Point(0, 0));
    this.addGameObject(firstBlockhead, 1);

    this.redrawCanvas();

    // TODO: Remove this section once we've automated collision detection.
    this.enemy = firstBlockhead;
  }

  // TODO: Remove this section once we've automated collision detection.
  public doTheyIntersect() {
    console.log("Checking the intersecton of the ship and the enemy - GameboardComponent.doTheyIntersect() start");
    let shipBoundingBox = this.ship.getBoundingBox();
    let enemyBoundingBox = this.enemy.getBoundingBox();

    /** 
     * FIXME: These bounding boxes aren't getting made correctly. Their y
     * coordinates are all wrong. Probably due to thinking that increasing
     * y would move the item northward instead of southward.
     */
    this.shipsMightIntersect = IntersectionUtility.doBoundingBoxesIntersect(shipBoundingBox, enemyBoundingBox);
    this.playerShipLocation = `Upper-left corner: [(${shipBoundingBox.upperLeft.xCoordinate}, ${shipBoundingBox.upperLeft.yCoordinate})]; Lower-right corner: [(${shipBoundingBox.lowerRight.xCoordinate}, ${shipBoundingBox.lowerRight.yCoordinate})]`;
    this.enemyShipLocation = `Upper-left corner: [(${enemyBoundingBox.upperLeft.xCoordinate}, ${enemyBoundingBox.upperLeft.yCoordinate})]; Lower-right corner: [(${enemyBoundingBox.lowerRight.xCoordinate}, ${enemyBoundingBox.lowerRight.yCoordinate})]`;
    console.log("GameboardComponent.doTheyIntersect() end.");
  }

  addGameObject(newPiece: GameObject, layer: number) {
    // If the mentioned layer doesn't exist, add it with newPiece being the only thing on it.
    if(this.allGameItems.has(layer) == false) {
      this.allGameItems.set(layer, [newPiece]);
    } else {
      let currentLayer: GameObject[] = this.allGameItems.get(layer);
      let indexOfPiece = currentLayer.indexOf(newPiece);

      // If the GameObject doesn't already exist on this layer, add it.
      if(indexOfPiece > 0) {
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

    // I'm only keeping this around as an example of the syntax from that Tetris game demo.
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

    let positionalShift: Movement = null;
    // TODO: Add diagonal movement later on.

    switch(event.keyCode) {
      // TODO: event.preventDefault();

      // Set the ship's next movement to be distance one action is expected to
      // require and take however long it was configured to take.
      case KeyCodes.LEFT:
        positionalShift = new Movement(0 - this.ship.baseMovementStep, 0, this.ship.baseMovementDuration);
        break;

      case KeyCodes.RIGHT:
        positionalShift = new Movement(this.ship.baseMovementStep, 0, this.ship.baseMovementDuration);
        break;

      case KeyCodes.UP:
        positionalShift = new Movement(0, 0 - this.ship.baseMovementStep, this.ship.baseMovementDuration);
        break;

      case KeyCodes.DOWN:
        positionalShift = new Movement(0, this.ship.baseMovementStep, this.ship.baseMovementDuration);
        break;
    }

    // TODO: Move the other items in the world here, enemy ships, projectiles, etc.

    // TODO: Iterate over the other items on the ship's layer and confirm there won't be any collisions!
    /**
     * VERY IMPORTANT: I can't just check to see if any two items collide at
     * the end of a tick! I need to know to if any of them pass through each
     * other _during_ the tick!
     * (This is a bit simpler since only objects on the same layer can collide)
     */

    if(isNull(positionalShift) == false) {
      this.ship.overwriteNextMove(positionalShift);
    }
  }

  /**
   * For every layer, for each GameObject in that layer, if it has a movementPattern, apply it.
   */
  executeWorldTick() {
    console.log("World tick start.");
    this.allGameItems.forEach((currentObjectList: GameObject[]) => {
      currentObjectList.forEach((currentObject: GameObject) => {
        if(isNull(currentObject.movementPattern) === false
        && currentObject.movementPattern.length > 0) {
          // TODO: Handle potential colisions, stepping out of bounds, etc. here.
          currentObject.takeNextMove();
        }
      })
    });
    /**
     * Currently I'm moving each piece on every layer in an arbitrary order and
     * then checking for collisions at the end of every tick.
     * FIXME: this isn't enough. I can't check for colisions at the end of a
     * tick, I need to plot out each piece's next move and determine which
     * pieces _will_ collide during the execution of their movements.
     * This will involve making a special bounding box that involves overlaying
     * the existing bounding box onto each spot the shape will travel (essentially
     * tracing lines from each of the shape's edges starting position through
     * every position they will occupy, to the end position.)
     * If those bounding boxes intersect then we will need to walk through each
     * moment of the two shape's journies to determine if they would ever be in
     * the same place at the same time.
     */
    // TODO: once this method has been confirmed to work, upgrade it to check
    // all relevant objects.
    this.doTheyIntersect()
    console.log("World tick end.");
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
