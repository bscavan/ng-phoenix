import { GameObject, Movement, SingleMoveGameObject } from './game-object';
// FIXME: Remove isNull and isUndefined...
import { isNull, isUndefined } from 'util';
import { AxisAlignedBoundingBox } from '../intersection-utility';

export class Point {
    xCoordinate: number;
    yCoordinate: number;

    constructor(xCoordinate: number, yCooridinate: number) {
        this.xCoordinate = xCoordinate;
        this.yCoordinate = yCooridinate;
    }
}
/**
 * FIXME: Split this up into separate files for each class.
 * I have a circular dependency here...
 */
export class Shape {
    // Note: the coordinates of these points are relative to the shape. They aren't absolute.
    exteriorCorners: Point[];
    color: string;
    outlineColor: string;

    constructor(exteriorCorners: Point[], color: string, outlineColor: string) {
        this.exteriorCorners = exteriorCorners;
        this.color = color;

        if(isNull(outlineColor) || isUndefined(outlineColor)) {
            this.outlineColor = color;
        } else {
            this.outlineColor = outlineColor;
        }
    }

    // TODO: Optimize this so it only gets re-generated after the list of shapes changes.
    generateBoundingBox(): AxisAlignedBoundingBox {
        let highestNorth = 0;
        let lowestSouth = 0;
        let currentPosition_Y = 0;

        let farthestEast = 0;
        let farthestWest = 0;
        let currentPosition_X = 0;

        this.exteriorCorners.forEach(currentCorner => {
            // On screens, a greater Y is lower down
            currentPosition_Y = currentCorner.yCoordinate;

            if(currentPosition_Y < highestNorth) {
                highestNorth = currentPosition_Y;
            }

            if(currentPosition_Y > lowestSouth) {
                lowestSouth = currentPosition_Y;
            }

            currentPosition_X = currentCorner.xCoordinate;

            if(currentPosition_X > farthestEast) {
                farthestEast = currentPosition_X;
            }

            if(currentPosition_X < farthestWest) {
                farthestWest = currentPosition_X;
            }
        });

        let min = new Point(farthestWest, highestNorth);
        let max = new Point(farthestEast, lowestSouth);

        return new AxisAlignedBoundingBox(min, max);
    }
}

export class ShipPiece extends SingleMoveGameObject {
    // FIXME: Shouldn't these values be parameters for the constructor?
    /**
     * The number of units of space this GameObject can move in one action.
     * // FIXME: This should probably instead be a measurent of distance per speed? I don't know yet.
     */
    public baseMovementStep: number = 0;

    /**
     * The number seconds of in-game time it takes this GameObject to make one movement action.
     */
    public baseMovementDuration: number = 0;

    public fireProjectile: boolean = false;
}

export class Highwind extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "blue";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "blue";
    public static readonly DEFAULT_MAX_HP = 1;
    // TODO: Look into items like Sonic-style bubble shields that give you contact damage for a limited time?
    public static readonly DEFAULT_CONTACT_DAMAGE = 1;

    constructor(upperLeftCorner: Point) {
        // Currently highwind is an equalateral triangle.
        let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        //let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
        let shipShapes: Shape[] = [new Shape(points, Highwind.DEFAULT_COLOR, Highwind.DEFAULT_OUTLINE_COLOR)];

        super(upperLeftCorner, shipShapes, null);
        // Setting time and movement-determining values here.
        this.setTimeFactor(1);
        this.baseMovementStep = 1;
        this.baseMovementDuration = 1;
        super.maximumHealth = Highwind.DEFAULT_MAX_HP;
        super.currentHealth = Highwind.DEFAULT_MAX_HP;
        super.contactDamage = Highwind.DEFAULT_CONTACT_DAMAGE;
    }
}

export class Projectile extends GameObject {
    public static readonly DEFAULT_COLOR: string = "green";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "green";
    public static readonly DEFAULT_MAX_HP = 1;
    public static readonly DEFAULT_CONTACT_DAMAGE = 1;

    constructor(upperLeftCorner: Point) {
        //let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        let points: Point[] = [new Point(0, 0), new Point(0, .5), new Point(.5, .5), new Point(.5, 0)];
        let shipShapes: Shape[] = [new Shape(points, Projectile.DEFAULT_COLOR, Projectile.DEFAULT_OUTLINE_COLOR)];
        /**
         * TODO: Make more complex paths for the projectiles fired from
         * different weapons. Also look into setting up Movements to be
         * 1) straight lines that are angled (especially for ones that are
         * part of the tri-shot and later weapons), 2) projectiles that
         * swerve back and forth in a sine-curve pattern, etc.
         *
         * Once you can fire shots at arbitrary angles (like the three in the
         * tri-shot) also look into programming enemy ships to angle their
         * shots to hit the player's current position (players will need to
         * keep moving).
         *
         * After that look into programming enemy ships to follow general
         * sets of patterns that trend toward the player's lateral position.
         * This way you can get the swarming, clustering effect that later
         * ships had in PAB. Also look into getting the same service that
         * despawns projectiles to track details like how many of the enemy
         * ships are left. Then it could notify all of the ships when certain
         * conditions are met. This would let me make ships that only swarm
         * when a certain portion of the fleet has been destroyed.
         *
         * Remember, we already want to know when all of the enemy ships have
         * been destroyed so we know when the player has beaten the level!
         */
        let straightAhead: Movement[] = [new Movement(0, -1, 1)];
        /**
         * It is absolutely necessary we create a new Point. if the old Point
         * is used then when it moves anything referencing it will move along
         * with it. Ergo, if the projectile starts at the position where its
         * ship is the ship will be moved along with the projectile!
         */
        let corner = new Point(upperLeftCorner.xCoordinate, upperLeftCorner.yCoordinate);

        super(corner, shipShapes, straightAhead);
        super.maximumHealth = Projectile.DEFAULT_MAX_HP;
        super.currentHealth = Projectile.DEFAULT_MAX_HP;
        super.contactDamage = Projectile.DEFAULT_CONTACT_DAMAGE;
    }
}

// TODO: Add an interface for ships and have it come with a method to get
// the rate of fire to determine how often (in game time) enemy ships should fire projectiles
//public static readonly DEFAULT_RATE_OF_FIRE = 1;
export class SimpleBlockHead extends GameObject {
    public static readonly DEFAULT_COLOR: string = "red";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "red";
    public static readonly DEFAULT_MAX_HP = 3;
    public static readonly DEFAULT_CONTACT_DAMAGE = 3;

    constructor(upperLeftCorner: Point) {
        //let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        let points: Point[] = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
        let shipShapes: Shape[] = [new Shape(points, SimpleBlockHead.DEFAULT_COLOR, SimpleBlockHead.DEFAULT_OUTLINE_COLOR)];
        let backAndForth: Movement[] = [new Movement(1, 0, 1), new Movement(1, 0, 1),
            new Movement(-1, 0, 1), new Movement(-1, 0, 1)];

        super(upperLeftCorner, shipShapes, backAndForth);
        super.maximumHealth = SimpleBlockHead.DEFAULT_MAX_HP;
        super.currentHealth = SimpleBlockHead.DEFAULT_MAX_HP;
        super.contactDamage = SimpleBlockHead.DEFAULT_CONTACT_DAMAGE;
    }
}
