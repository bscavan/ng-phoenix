import { AxisAlignedBoundingBox } from '../intersection-utility';
import { Point, Projectile, Shape } from './ship-piece';
import { TimeFactorNode } from './timestream';

export class GameObject {
    upperLeftCorner: Point;

    /**
     * List of shapes that make up the body of this ship.
     * To be used for both drawing on the canvas and detecting colissions.
     */
    shapes: Shape[];

    private boundingBox: AxisAlignedBoundingBox;


    // TODO: Later add things like firing shots (either straight ahead, at static angles, or aimed towards the player)
    /**
     * List of all Movements assigned to the GameObject. The current position
     * in this list is nextMoveIndex and the amount of in-game time that has
     * passed since starting the current movement is timeIntoCurrentMove. As
     * in-game time passes 
     */
    movementPattern: Movement[];

    /**
     * Index of whichever move is to be executed next, refering to its position
     * in movementPattern. This number is incremented when the current move is
     * completed and if it exceeds the length of movementPattern it is "rolled
     * around" through use of a modulus operator, letting the movements in 
     * movementPattern loop.
     */
    nextMoveIndex: number = 0;

    /**
     * The amount of time that has passed while executing part of the current
     * move, measured in units of in-game time.
     * As time is spent on the current move, this number increases, letting the
     * time remaining on that move be tracked.
     * When this number exceeds the duration of the current move, nextMoveIndex
     * is incremented and the duration of the now completed move is subtracted
     * from it.
     */
    timeIntoCurrentMove: number = 0;

    /**
     * The number of seconds of in-game time that take place for each tick of
     * the game's internal clock.
     */
    individualTimeFactor: number = 1

    /**
     * The specific "timestream" this gameObject exists in. This is effectively
     * a series of multipliers that determine how many seconds of in-game time
     * this object experiences per world tick.
     * @see TimeFactorNode for a full description.
     */
    timeChannel: TimeFactorNode;

    /**
     * The amount of base damage this GameObject can do to another GameObject
     * on impact, if any.
     */
    contactDamage: number = null;

    maximumHealth: number = null;

    currentHealth: number = null;

    constructor(upperLeftCorner: Point, shapes: Shape[], movementPattern: Movement[]) {
        this.upperLeftCorner = upperLeftCorner;
        this.shapes = shapes;
        this.movementPattern = movementPattern;
    }

    public getShapes(): Shape[] {
        return this.shapes;
    }

    public setShapes(newShapes: Shape[]) {
        this.shapes = newShapes;
        this.regenerateBoundingBox();
    }

    public getBoundingBox() {
        if(this.boundingBox === null || this.boundingBox === undefined) {
            this.regenerateBoundingBox();
        }

        return this.boundingBox;
    }

    /**
     * FIXME: This should be a centrally stored and referenced value. Not
     * something unique to each GameObject.
     * Or at least it should reference a central value as a multiplier so
     * I can adjust everything at once.
     */
    public getIndividualTimeFactor() {
        return this.individualTimeFactor;
    }

    public setIndividualTimeFactor(individualTimeFactor: number) {
        this.individualTimeFactor = individualTimeFactor;
    }

    public getTimeChannel() {
        return this.timeChannel;
    }

    public setTimeChannel(timeChannel: TimeFactorNode) {
        this.timeChannel = timeChannel;
    }

    public getEffectiveTimeFactor() {
        let factor = this.getIndividualTimeFactor();

        if(this.timeChannel !== null && this.timeChannel !== undefined) {
            factor = factor * this.timeChannel.getTimeFactor();
        }

        return factor;
    }

    public getContactDamage() {
        return this.contactDamage;
    }

    public setContactDamage(contactDamage: number) {
        this.contactDamage = contactDamage;
    }

    public getMaximumHealth() {
        return this.maximumHealth;
    }

    public setMaximumHealth(maximumHealth: number) {
        this.maximumHealth = maximumHealth;
    }

    public getCurrentHealth() {
        return this.currentHealth;
    }

    public setCurrentHealth(currentHealth: number) {
        this.currentHealth = currentHealth;
    }

    public decreaseCurrentHealth(amountToDecrease: number) {
        this.currentHealth = Math.max(this.currentHealth - amountToDecrease, 0);
    }

    hasNextMove(): boolean {
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            return false;
        } else {
            return true;
        }
    }

    // TODO: Handle collisions as events.
    // TODO: Add projectiles!
    // TODO: script out other enemy actions besides moves, like firing projectiles.

    takeNextMove(): Projectile[] {
        let createdProjectiles: Projectile[] = [];
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            // TODO: Throw or log an error here!
            console.error("takeNextMove() was called on an object without any movements planned or with a negative value for nextMoveIndex. It cannot be moved.");
            return createdProjectiles;
        } else {

            // TODO: Ensure currentMove.duration isn't 0 here...

            let xAdjustment = 0;
            let yAdjustment = 0;

            // Grab the current ratio of game time seconds to every tick of the game clock.
            // This will be the full amount of time in seconds of game time that will pass this tick.
            let secondsLeftInCurrentTick = this.getEffectiveTimeFactor();

            while(secondsLeftInCurrentTick > 0) {
                // If the nextMoveIndex refers to an item outside the bounds of the array, set it to the remainder looping back around again.
                this.nextMoveIndex = this.nextMoveIndex % this.movementPattern.length;

                let currentMove = this.movementPattern[this.nextMoveIndex];
                let currentMoveDuration = currentMove.duration;

                // This is the remaining amount of absolute time the current move will take.
                let timeRemainingInCurrentMove = currentMoveDuration - this.timeIntoCurrentMove;

                // TODO: If timeRemainingInCurrentMove is less than or equal to zero it then we
                // have a serious problem here.

                // Determine how long (in time) the current movement has left
                let timeThatWillBeSpentInCurrentMovement;

                /**
                 * If the current move will take longer than the time left in
                 * the current tick, only move as far as the time will allow.
                 * The rest of the move will be handled on future ticks.
                 */
                if(secondsLeftInCurrentTick < timeRemainingInCurrentMove) {
                    timeThatWillBeSpentInCurrentMovement = secondsLeftInCurrentTick;
                } else {
                    timeThatWillBeSpentInCurrentMovement = timeRemainingInCurrentMove
                }

                // Remove the current movement's 'time from secondsLeftInCurrentTick
                secondsLeftInCurrentTick = secondsLeftInCurrentTick - timeThatWillBeSpentInCurrentMovement;

                // Determine how much (distance) of the current move needs to be applied
                let percentageOfMovementExecuted = (timeThatWillBeSpentInCurrentMovement / currentMoveDuration)

                // Adjust the positions by a distance proportional to the amount of time remaining in the current move
                xAdjustment = xAdjustment + currentMove.xMovement * percentageOfMovementExecuted
                yAdjustment = yAdjustment + currentMove.yMovement * percentageOfMovementExecuted

                // Increase the time progressed into the current move by the amount of time spent here.
                this.timeIntoCurrentMove = this.timeIntoCurrentMove + timeThatWillBeSpentInCurrentMovement;

                // Move the GameObject.
                /**
                 * FIXME: This regenerates the bounding boxes every time is that an issue?
                 *
                 * Actually, I could use this. I could add the corners of this shape to a
                 * collection and create a polygon that connects the outermost points of the
                 * object as it moves in each step. If it moves eastwards three times over
                 * the tick then it would be the bounding box of after the first move, with
                 * its eastward edge extended out by two steps. I could then use these for
                 * detecting collisions that _should_ happen between ticks (like if
                 * everything is moving at 16x speed. I don't want enemy ships clipping
                 * through the player's attacks). And this should be far less costly than
                 * checking for collisions between everything after every fraction of a tick.
                 */
                this.shiftPosition(xAdjustment, yAdjustment);

                createdProjectiles = createdProjectiles.concat(this.postMoveActions(timeThatWillBeSpentInCurrentMovement));

                // If the current move has been completed
                if(this.timeIntoCurrentMove >= currentMoveDuration) {
                    if(currentMove.doesOnlyRunOnce()) {
                        // Remove the move that was just completed.
                        this.movementPattern.splice(this.nextMoveIndex, 1);
                    } else {
                        // Increment to the next move, keeping the current move where it is.
                        this.nextMoveIndex++;
                    }

                    // reset this.timeIntoCurrentMove because we just finished a move.
                    this.timeIntoCurrentMove = 0;
                }
            }
        }

        return createdProjectiles;
    }

    public postMoveActions(seconds: number) : Projectile[]  {
        return [];
    }

    /**
     * NOTICE: This does not regenerate the BoundingBox
     * TODO: Deprecate this.
     */
     moveToPoint(point: Point) {
        this.moveToCoordinates(point.xCoordinate, point.yCoordinate);
    }

    /**
     * NOTICE: This does not regenerate the BoundingBox!
     * TODO: Deprecate this.
     */
     moveToCoordinates(xCoordinate: number, yCoordinate: number) {
        this.upperLeftCorner.xCoordinate = xCoordinate;
        this.upperLeftCorner.yCoordinate = yCoordinate;
    }

    /**
     * NOTICE: This does not respect durations!
     * TODO: Deprecate this.
     */
    moveGameObjectImmediately(movement: Movement) {
        this.shiftPosition(movement.xMovement, movement.yMovement);
    }

    shiftPosition(xOffset: number, yOffset: number) {
        this.upperLeftCorner.xCoordinate = this.upperLeftCorner.xCoordinate + xOffset;
        this.upperLeftCorner.yCoordinate = this.upperLeftCorner.yCoordinate + yOffset;
        this.regenerateBoundingBox();
        // TODO: Determine if it is enough to simply shift the existing
        // bounding box instead of regenerating it. That could save
        // massively on overhead later on.
    }

    // TODO: JAVADOC
    regenerateBoundingBox() {
        let highestNorth = 0;
        let lowestSouth = 0;

        let farthestEast = 0;
        let farthestWest = 0;

        this.shapes.forEach(currentShape => {
            let currentBox = currentShape.generateBoundingBox();

            // Remember we're on a computer: a lower value for "y" is further north!
            if(currentBox.upperLeft.yCoordinate < highestNorth) {
                highestNorth = currentBox.upperLeft.yCoordinate;
            }

            // Remember we're on a computer: a greater value for "y" is further south!
            if(currentBox.lowerRight.yCoordinate > lowestSouth) {
                lowestSouth = currentBox.lowerRight.yCoordinate;
            }

            if(currentBox.lowerRight.xCoordinate > farthestEast) {
                farthestEast = currentBox.lowerRight.xCoordinate;
            }

            if(currentBox.upperLeft.xCoordinate < farthestWest) {
                farthestWest = currentBox.upperLeft.xCoordinate;
            }
        });

        // Create two new points for the corners of the bounding box and offset them by the coordinates of this.upperLeftCorner.
        let upperLeft = new Point(farthestWest + this.upperLeftCorner.xCoordinate, highestNorth + this.upperLeftCorner.yCoordinate);
        let lowerRight = new Point(farthestEast + this.upperLeftCorner.xCoordinate, lowestSouth + this.upperLeftCorner.yCoordinate)

        this.boundingBox = new AxisAlignedBoundingBox(upperLeft, lowerRight);
    }
}

// Note, each movement is relative to the current position.
// Holding in position is accomplished with 0 movement and a duration.
export class Movement {
    // Measured in px, unless the canvas has been scaled up? (Well in that case we wouldn't care anyway, right?)
    xMovement: number;
    yMovement: number;
    runOnlyOnce: boolean = false;

    /**
     * Length of in-game seconds this movement will take from start to finish.
     */
    duration: number;

    constructor(xMovement: number, yMovement: number, duration: number) {
        this.xMovement = xMovement;
        this.yMovement = yMovement;
        this.duration = duration;
    }

    public doesOnlyRunOnce(): boolean {
        return this.runOnlyOnce;
    }

    public setRunOnlyOnce(runOnlyOnce: boolean) {
        this.runOnlyOnce = runOnlyOnce;
    }
}

export class SingleMovement extends Movement {
    constructor(xMovement: number, yMovement: number, duration: number) {
        super(xMovement, yMovement, duration);
        this.setRunOnlyOnce(true);
    }
}

// TODO: Split these classes off into separate files.

/**
 * This is a GameObject that can have a series of moves assigned to it which
 * are then executed in order. Once each  move is executed it is removed from
 * the movementPattern.
 */
export class SingleMoveGameObject extends GameObject {
    addMovement(nextMove: Movement) {
        nextMove.setRunOnlyOnce(true);
        this.movementPattern.push(nextMove);
    }

    // TODO: Determine if things other than projectiles should be returnable here.
    // Maybe this should be a collection of GameObjects?
    takeNextMove(): Projectile[] {
        // Execute the next movement.
        let createdProjectiles: Projectile[] = super.takeNextMove();

        // In the event that an error caused nextMoveIndex to become less than zero, set it to zero here.
        if(this.nextMoveIndex < 0) {
            this.nextMoveIndex = 0;
        }

        return createdProjectiles;
    }

    // TODO: Be careful with this one. It will completely delete any pre-scripted moves.
    // In the future it might be better to non-destructively insert blocks of moves.
    overwriteNextMove(nextMove: Movement) {
        nextMove.setRunOnlyOnce(true);
        // the second "move" is a non-movement. It just sits there like a platypus.
        this.movementPattern = [nextMove, new Movement(0, 0, 1)];
        this.nextMoveIndex = 0;
        this.timeIntoCurrentMove = 0;
    }
    // TODO: Be careful with this one. It will completely delete any pre-scripted moves.
    // In the future it might be better to non-destructively insert blocks of moves.
    overwriteNextMove_orig(nextMove: Movement) {
        nextMove.setRunOnlyOnce(true);
        this.movementPattern = [nextMove];
        this.nextMoveIndex = 0;
        this.timeIntoCurrentMove = 0;
    }
}
