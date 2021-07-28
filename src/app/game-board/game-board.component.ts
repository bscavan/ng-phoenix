import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { COLS, BLOCK_SIZE, ROWS, PLAYER_LAYER, PLAYER_PROJECTILE_LAYER, ENEMY_LAYER, ENEMY_PROJECTILE_LAYER } from '../constants';
import { GameService } from '../game-service';
import { KeyCodes } from './KeyCodes';
import { Point, ShipPiece, Highwind, SimpleBlockHead, Projectile, GunnerBlockHead, ComplexGunnerBlockHead } from './ship-piece';
import { isNull } from 'util';
import { CustomCanvas } from './custom-canvas';
import { GameObject, Movement } from './game-object';
import { AxisAlignedBoundingBox, IntersectionUtility } from '../intersection-utility';
import { TimeFactorNode, Timestream } from './timestream';

export const MILLISECONDS_PER_WORLD_TICK = 500;

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

  // TODO: add a secondary canvas here and swap them out when resetting things...
  //secondaryCanvas: CustomCanvas;
  gameCanvas: CustomCanvas;
  points: number;
  lines: number;
  level: number;
  ship: ShipPiece;
  startPosition: Point = new Point(5, 2);

  timestream: Timestream = new Timestream();
  worldTimeChannel: TimeFactorNode;
  enemyShipsTimeChannel: TimeFactorNode;
  enemyProjectileTimeChannel: TimeFactorNode;
  playerShipTimeChannel: TimeFactorNode;
  playerProjectileTimeChannel: TimeFactorNode;

  /**
   * Pausing the game literally stops the gameClock?
   *    No ticks occur when the game is paused?
   *
   * Setting the modifiers of timeChannels to 0 stops the gameObjects that use
   * them from moving despite the game clock ticking forward.
   * Ergo, a "freeze ray" could add coloration to the player ship, put a shape
   * beneath it (a block of ice) and then set their speed to 0 for a limited
   * number of ticks
   *    (TODO: Figure out how to make temporary conditions like that.)
   * Whereas a "time stop" ability the player uses would set the multipliers
   * for the enemy ships, enemy projectiles, and (possibly) player projectiles
   * all to 0.
   */

  /**
   * This is the reference for the interval responsible for tracking real time
   * and scheduling all actions in the game.
   */
  private gameClockId;

  /**
   * The key of this map is the layer each GameObject[] resides on.
   * Higher layers are drawn later, meaning they can cover up lower ones.
   * Also, when checking for potential collisions, only objects on particular
   * layers can collide with each other, which saves on the number of checks
   * that must be run.
  */
  public allGameItems: Map<number, GameObject[]> = new Map<number, GameObject[]>();

  /**
   * A collection that describes the relationship between GameObjects on
   * different layers in allGameItems.
   * Within the map layer numbers are mapped to Sets of CollisionObjects,
   * which define what occurs occurs when an objects on the first layer are
   * found to collide with those on the second layer.
   */
  public layersThatCanCollide: Map<number, Set<CollisionObject>> = new Map<number, Set<CollisionObject>>();

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

    // Setting up the timeFactors for everything in this game. These affect the effective speeds of everything.
    this.worldTimeChannel = this.timestream.getWorldRootTimestream();
    // TODO: Make these channel names into constants...
    this.playerShipTimeChannel = this.timestream.makeNewBranch("playerShipTimeChannel", Timestream.WORLD_ROOT_KEY, 1);
    this.playerProjectileTimeChannel = this.timestream.makeNewBranch("playerProjectileTimeChannel", Timestream.WORLD_ROOT_KEY, 1);
    this.enemyShipsTimeChannel = this.timestream.makeNewBranch("enemyShipTimeChannel", Timestream.WORLD_ROOT_KEY, 1);
    this.enemyProjectileTimeChannel = this.timestream.makeNewBranch("enemyProjectileTimeChannel", Timestream.WORLD_ROOT_KEY, 1);

    /**
     * Setting up the collision rules here.
     */
    let playerCollisionSet = new Set<CollisionObject>();
    playerCollisionSet.add(new CollisionObject(ENEMY_LAYER, new ContactDamageEvent()));
    playerCollisionSet.add(new CollisionObject(ENEMY_PROJECTILE_LAYER, new ContactDamageEvent()));
    /** 
     * TODO: Determine if multiple ContactDamage events are even necessary.
     * What about just referencing the class and calling the static method
     * whenever it's needed?
     */

    // TODO: Add a pause feature (stopping the clock)

    this.layersThatCanCollide.set(PLAYER_LAYER, playerCollisionSet);

    let playerProjectileCollisionSet = new Set<CollisionObject>();
    playerProjectileCollisionSet.add(new CollisionObject(ENEMY_LAYER, new ContactDamageEvent()));

    this.layersThatCanCollide.set(PLAYER_LAYER, playerProjectileCollisionSet);
  }

  startGameClock() {
    this.gameClockId = setInterval(() => {
      this.executeWorldTick();
      this.redrawCanvas();
       /**
        * TODO: Add in the ability to pause the world clock (suspending all
        * ticks) and also to change the number of ticks per second.
        */
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
    this.gameCanvas.setWidth(COLS * BLOCK_SIZE);
    this.gameCanvas.setHeight(ROWS * BLOCK_SIZE);

    // Scales up the canvas so that each pixel is shown as a full block.
    this.gameCanvas.scale(BLOCK_SIZE, BLOCK_SIZE);
  }

  // TODO: Rename this method.
  // FIXME: Pressing this a second time should not just spawn a new enemy.
  play() {
    this.startGameClock();
    this.ship = new Highwind(this.startPosition);
    this.ship.setTimeChannel(this.playerShipTimeChannel);
    this.addGameObject(this.ship, PLAYER_LAYER);

    // TODO: Come up with a registry of items that have behaviors. Each tick update their position based on those.
    // Most enemy ships should loop through actions (flying in formation) with only later ones actually tracking the player.
    //let firstBlockhead = new SimpleBlockHead(new Point(0, 0));
    let firstBlockhead = new GunnerBlockHead(new Point(0, 0));
    //let firstBlockhead = new ComplexGunnerBlockHead(new Point(0, 0));
    this.addEnemy(firstBlockhead);

    // TODO: Test GunnerBlockHead and ComplexGunnerBlockHead...

    this.redrawCanvas();
  }

  pauseGame() {
    if(this.worldTimeChannel.timeModifier != 0) {
      this.worldTimeChannel.timeModifier = 0;
    } else {
      this.worldTimeChannel.timeModifier = 1;
    }
  }

  /**
   * TODO: Add a test to GameObject that mimics this, changing the timeFactor
   * from .5 to 1 three ticks in. Assert that the position is correct after
   * each tick.
   *
   * FIXME: If you change the enemy speed twice in a row, before a tick happens,
   * it's possible to get an extra move out of the gameObject. Need to experiment
   * with this further...
   * Also, even if you don't mess up the movements, it's possible to get the
   * projectiles off kilter. 
   */
  public changeEnemySpeed() {
    if(this.enemyShipsTimeChannel !== undefined && this.enemyShipsTimeChannel !== null) {
      if(this.enemyShipsTimeChannel.getTimeModifier() === 1) {
        this.enemyShipsTimeChannel.setTimeModifier(.5);
      } else {
        this.enemyShipsTimeChannel.setTimeModifier(1);
      }
    }
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

  addPlayerProjectile(newPiece: GameObject) {
    newPiece.setTimeChannel(this.playerProjectileTimeChannel)
    this.addGameObject(newPiece, PLAYER_PROJECTILE_LAYER);
  }

  removePlayerProjectile(newPiece: GameObject) {
    this.removeGameObject(newPiece, PLAYER_PROJECTILE_LAYER);
  }

  addEnemy(newPiece: GameObject) {
    newPiece.setTimeChannel(this.enemyShipsTimeChannel);
    this.addGameObject(newPiece, ENEMY_LAYER);
  }

  removeEnemy(newPiece: GameObject) {
    this.removeGameObject(newPiece, ENEMY_LAYER);
  }

  addEnemyProjectile(newPiece: GameObject) {
    newPiece.setTimeChannel(this.enemyProjectileTimeChannel)
    this.addGameObject(newPiece, ENEMY_PROJECTILE_LAYER);
  }

  removeEnemyProjectile(newPiece: GameObject) {
    this.removeGameObject(newPiece, ENEMY_PROJECTILE_LAYER);
    console.log("Removing enemy projectile now.");
  }

  removeGameObject(targetPiece: GameObject, layer: number) {
    if(this.allGameItems.has(layer)) {
      let currentLayer: GameObject[] = this.allGameItems.get(layer);
      let indexOfPiece = currentLayer.indexOf(targetPiece);

      // If targetPiece does exist on this layer, remove it.
      if(indexOfPiece >= 0) {
        currentLayer.splice(indexOfPiece, 1);
      }
    }
  }

  removeGameObjectLayer(layer: number) {
    this.allGameItems.delete(layer);
  }

  /*
   * Tthis only updates a value for tracking the player's last input.
   * All of the real logic for moving items over time is in a method that
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
        // FIXME: Convert these to use this.ship.getMovementDuration() instead.
        break;

      case KeyCodes.RIGHT:
        positionalShift = new Movement(this.ship.baseMovementStep, 0, this.ship.baseMovementDuration);
        // FIXME: Convert these to use this.ship.getMovementDuration() instead.
        break;

      case KeyCodes.UP:
        positionalShift = new Movement(0, 0 - this.ship.baseMovementStep, this.ship.baseMovementDuration);
        // FIXME: Convert these to use this.ship.getMovementDuration() instead.
        break;

      case KeyCodes.DOWN:
        positionalShift = new Movement(0, this.ship.baseMovementStep, this.ship.baseMovementDuration);
        // FIXME: Convert these to use this.ship.getMovementDuration() instead.
        break;

      case KeyCodes.FIRE:
        this.ship.shouldFireWhenCapable = true;
        break;
    }

    /**
     * VERY IMPORTANT: I can't just check to see if any two items collide at
     * the end of a tick! I need to know to if any of them pass through each
     * other _during_ the tick!
     * (This is a bit simpler since only objects on the same layer can collide?)
     */

    if(positionalShift !== undefined && positionalShift !== null) {
      this.ship.overwriteNextMove(positionalShift);
    }
  }

  /**
   * For every layer, for each GameObject in that layer, if it has a movementPattern, apply it.
   */
  executeWorldTick() {
    //console.log("World tick start.");
    this.allGameItems.forEach((currentObjectList: GameObject[]) => {
      currentObjectList.forEach((currentObject: GameObject) => {
        // TODO: Handle the player stepping out of bounds here.

        if(currentObject.movementPattern !== null
        && currentObject.movementPattern.length > 0) {
          let createdProjectiles: Projectile[] = currentObject.takeNextMove();

          if(createdProjectiles != null && createdProjectiles.length > 0) {
            if(currentObject === this.ship) {
              // This is the player ship, so put the Projectiles on the PLAYER_PROJECTILE_LAYER.
              createdProjectiles.forEach((currentProjectile) => {
                this.addPlayerProjectile(currentProjectile);
              });
            } else {
              // This is not the player ship, so put the projectile on the ENEMY_PROJECTILE_LAYER.
              createdProjectiles.forEach((currentProjectile) => {
                this.addEnemyProjectile(currentProjectile);
              });
            }
          }
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

    // Checking for collisions here:
    this.layersThatCanCollide.forEach((collisionObjects: Set<CollisionObject>, layerNumber: number) => {
      let itemsOnCurrentLayer = this.allGameItems.get(layerNumber);

      // Iterate through the collection of every GameObject on the current layer.
      itemsOnCurrentLayer.forEach((currentGameObject: GameObject, index: number) => {
        // Iterate through all of the CollisionObjects registered for the current layer
        collisionObjects.forEach((currentCollisionObject: CollisionObject) => {
          let targetLayer = currentCollisionObject.layer;
          let itemsOnTargetLayer: GameObject[] = this.allGameItems.get(targetLayer);

          if(itemsOnTargetLayer === undefined || itemsOnTargetLayer === null) {
            console.error("A collision mapping was defined layersThatCanCollied that referenced a layer of allGameItems that was undefined.");
            this.allGameItems.set(targetLayer, []);
          } else {
            // Iterate through the collection of every GameObject on the target layer
            itemsOnTargetLayer.forEach((currentTarget: GameObject) => {
              if(IntersectionUtility.doBoundingBoxesIntersect(currentGameObject.getBoundingBox(), currentTarget.getBoundingBox())) {
                // TODO: Actually write IntersectionUtility.doShapesIntersect()...
                if(IntersectionUtility.doShapesIntersect(currentGameObject, currentTarget)) {
                  console.log("Collision detected!");
                  this.handleCollisionEvent(currentCollisionObject.event, currentGameObject, currentTarget);
                }
              }
            });
          }
        });
      });
    });

    if(this.allGameItems.has(PLAYER_PROJECTILE_LAYER)) {
      this.allGameItems.get(PLAYER_PROJECTILE_LAYER).forEach((currentProjectile: GameObject) => {
        if(this.isOutOfBounds(currentProjectile)) {
          this.removePlayerProjectile(currentProjectile);
        }
      });
    }

    if(this.allGameItems.get(ENEMY_PROJECTILE_LAYER)) {
      this.allGameItems.get(ENEMY_PROJECTILE_LAYER).forEach((currentProjectile: GameObject) => {
        if(this.isOutOfBounds(currentProjectile)) {
          this.removeEnemyProjectile(currentProjectile);
        }
      });
    }

    //console.log("World tick end.");
  }

  private isOutOfBounds(object: GameObject) {
    let bbox: AxisAlignedBoundingBox = object.getBoundingBox();

    if (bbox.upperLeft.yCoordinate < this.gameCanvas.getNorthenBoundary()
    || bbox.lowerRight.xCoordinate > this.gameCanvas.getEasternBoundary()
    || bbox.lowerRight.yCoordinate > this.gameCanvas.getSouthernBoundary()
    || bbox.upperLeft.xCoordinate < this.gameCanvas.getWesternBoundary()) {
      return true;
    }
  
    return false;
  }

  /*
   * TODO: In the method that calls this one, grab the value of a variable that
   * is updated (blindly) based on the user's keyboard/controller input. That
   * value is updated whenever the inputs change, but only read once per tick.
   * That way, regardless of how long in real time each tick is, we will only
   * let the player get one action per tick. (Holding down the left key won't
   * let them move their piece any faster than pressing it once per tick.)
   */
  redrawCanvas() {
    /**
     * Iterate over a list of GameObjects, drawing each one on the board.
     * The order in which they are drawn needs to be determined by a "layer"
     * value.
     */
    this.gameCanvas.clearCanvas();
    //this.secondaryCanvas.clearCanvas();

    // TODO: confirm this will iterate over the lists in ascending order.
    this.allGameItems.forEach((currentObjectList: GameObject[]) => {
      currentObjectList.forEach((currentObject: GameObject) => {
        this.gameCanvas.draw(currentObject);
        //this.secondaryCanvas.draw(currentObject);
      })
    });

    // let tempCanvas = this.gameCanvas;
    // this.gameCanvas = secondaryCanvas;
    // let secondaryCanvas = tempCanvas;
  }

  private handleCollisionEvent(event: CollisionEvent, first: GameObject, second: GameObject) {
    event.enactConsequencesOfCollision(first, second);
    /**
     * This needs to hook into a service that can be notified when GameObjects
     * reach 0hp, when they go outside a certain range, etc. In fact this
     * method should probably accept a reference to the service as a parameter.
     */
  }
}

class CollisionObject {
  layer: number;
  event: CollisionEvent;

  constructor(layer: number, event: CollisionEvent) {
    this.layer = layer;
    this.event = event;
  }
}

abstract class CollisionEvent {
  description: string;

  constructor(description: string) {
    this.description = description;
  }

  abstract enactConsequencesOfCollision(first: GameObject, second: GameObject);
}

class ContactDamageEvent extends CollisionEvent {
  constructor() {
    super("Both objects damage each other on contact.");
  }

  enactConsequencesOfCollision(first: GameObject, second: GameObject) {
    if(first.getContactDamage() !== null) {
      second.decreaseCurrentHealth(first.getContactDamage());
    }

    if(second.getContactDamage() !== null) {
      first.decreaseCurrentHealth(second.getContactDamage());
    }

    // TODO: Actually handle the consequences of either GameObject reaching 0 HP here.
    console.log("First GameObject's HP: [" + first.currentHealth + "]");
    console.log("Second GameObject's HP: [" + second.currentHealth + "]");
  }
}
