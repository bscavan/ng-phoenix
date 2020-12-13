import { Point, Shape } from './ship-piece';

export class GameObject {
    upperLeftCorner: Point;

    /**
     * List of shapes that make up the body of this ship.
     * To be used for both drawing on the canvas and detecting colissions.
     */
    shapes: Shape[];

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
    timeFactor: number = 1

    constructor(upperLeftCorner: Point, shapes: Shape[], movementPattern: Movement[]) {
        this.upperLeftCorner = upperLeftCorner;
        this.shapes = shapes;
        this.movementPattern = movementPattern;
    }

    public getTimeFactor() {
        return this.timeFactor;
    }

    public setTimeFactor(timeFactor: number) {
        this.timeFactor = timeFactor;
    }

    hasNextMove(): boolean {
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            return false;
        } else {
            return true;
        }
    }

    takeNextMove(): void {
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            // TODO: Throw or log an error here!
            return;
        } else {
            if(this.nextMoveIndex < 0) {
                return;
            }

            // If the nextMoveIndex refers to an item outside the bounds of the array, set it to the remainder looping back around again.
            this.nextMoveIndex = this.nextMoveIndex % this.movementPattern.length;

            // TODO: Ensure currentMove.duration isn't 0 here...

            let xAdjustment = 0;
            let yAdjustment = 0;

            // Grab the current ratio of game time seconds to every tick of the game clock.
            // This will be the full amount of time in seconds of game time that will pass this tick.
            let secondsLeftInCurrentTick = this.getTimeFactor();

            while(secondsLeftInCurrentTick > 0) {
                // TODO: Handle SingleMoveGameObject here. Add an escape
                // condition if the last movement was executed, dumped from
                // this.movementPattern and then left this.movementPattern
                // empty.

                let currentMove = this.movementPattern[this.nextMoveIndex];
                let timeRemainingInCurrentMove = currentMove.duration - this.timeIntoCurrentMove;
                // TODO: If timeRemainingInCurrentMove is less than or equal to zero it then we
                // have a serious problem here.

                // Determine how long (in time) the current movement has left
                let timeSpentInCurrentMovement;

                if(secondsLeftInCurrentTick < timeRemainingInCurrentMove) {
                    timeSpentInCurrentMovement = secondsLeftInCurrentTick;
                } else {
                    timeSpentInCurrentMovement = timeRemainingInCurrentMove
                }

                // Remove the current movement's 'time from secondsLeftInCurrentTick
                secondsLeftInCurrentTick = secondsLeftInCurrentTick - timeSpentInCurrentMovement;

                // Determine how much (distance) of the current move needs to be applied
                let percentageOfMovementExecuted = (timeSpentInCurrentMovement / currentMove.duration)

                // Adjust the positions by a distance proportional to the amount of time remaining in the current move
                xAdjustment = xAdjustment + currentMove.xMovement * percentageOfMovementExecuted
                yAdjustment = yAdjustment + currentMove.yMovement * percentageOfMovementExecuted

                // Increase the time progressed into the current move by the amount of time spent here.
                this.timeIntoCurrentMove = this.timeIntoCurrentMove + timeSpentInCurrentMovement;

                // If the current move has been completed then increment to the next move and reset this.timeIntoCurrentMove
                if(this.timeIntoCurrentMove >= currentMove.duration) {
                    this.nextMoveIndex++;
                    this.timeIntoCurrentMove = 0;
                }
            }

            // Move the GameObject.
            this.shiftPosition(xAdjustment, yAdjustment);

            // TODO: Perform any non-movement actions (like shooting) here.
        }
    }

    moveToPoint(point: Point) {
        this.moveToCoordinates(point.xCoordinate, point.yCoordinate);
    }

    moveToCoordinates(xCoordinate: number, yCoordinate: number) {
        this.upperLeftCorner.xCoordinate = xCoordinate;
        this.upperLeftCorner.yCoordinate = yCoordinate;
    }

    moveGameObject(movement: Movement) {
        this.shiftPosition(movement.xMovement, movement.yMovement);
    }

    shiftPosition(xOffset: number, yOffset: number) {
        this.upperLeftCorner.xCoordinate = this.upperLeftCorner.xCoordinate + xOffset;
        this.upperLeftCorner.yCoordinate = this.upperLeftCorner.yCoordinate + yOffset;
    }
}

// Note, each movement is relative to the current position.
// Holding in position is accomplished with 0 movement and a duration.
export class Movement {
    // Measured in px, unless the canvas has been scaled up? (Well in that case we wouldn't care anyway, right?)
    xMovement: number;
    yMovement: number;

    /**
     * Length of in-game seconds this movement will take from start to finish.
     */
    duration: number;

    constructor(xMovement: number, yMovement: number, duration: number) {
        this.xMovement = xMovement;
        this.yMovement = yMovement;
        this.duration = duration;
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
        this.movementPattern.push(nextMove);
    }

    takeNextMove() {
        // Execute the next movement.
        super.takeNextMove();
        // Remove that movement from movementPattern
        this.movementPattern.splice(0, 1);
        this.nextMoveIndex--;
    }

    overwriteNextMove(nextMove: Movement) {
        this.movementPattern = [nextMove];
    }
}
