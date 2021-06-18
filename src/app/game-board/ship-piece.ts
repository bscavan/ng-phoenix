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

    // TODO: Add an interface for ships and have it come with a method to get
    // the rate of fire to determine how often (in game time) enemy ships should fire projectiles
    //public static readonly DEFAULT_RATE_OF_FIRE = 1;

    /**
     * The amount of game time that needs to pass after the ship creates a
     * projectile has been created before the ship can fire again.
     */
    public cyclesDelayBetweenShots = 0;

    /**
     * The amount of game time that needs to pass until the next projectile can
     * be created. Should always be between maximumRateOfFire and 0.
     */
    public cyclesUntilNextFire = 0;

    // This is only getting used on player ships. Is it worth keeping around?
    public fireProjectileOnNextTick: boolean = false;

    public cycleGun(): Projectile | null {
        if(this.cyclesUntilNextFire > 0) {
            this.cyclesUntilNextFire--;
            return null;
        } else {
            return this.createProjectile();
        } 
    }

    public shouldFireProjectileOnNextTick() {
        return this.fireProjectileOnNextTick;
    }
    /*
     * TODO: Consider adding an instance of a "Gun" class to ShipPiece that
     * specifies the type of projectile, its movements, any angling of the shot,
     * etc. Standard guns could be instantiated and would save work.
     */
    public createProjectile() {
        this.cyclesUntilNextFire = this.cyclesDelayBetweenShots;
        return new Projectile(this.upperLeftCorner);
    }
}

export class Highwind extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "blue";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "blue";
    public static readonly DEFAULT_MAX_HP = 1;
    // TODO: Look into items like Sonic-style bubble shields that give you contact damage for a limited time?
    public static readonly DEFAULT_CONTACT_DAMAGE = 1;

    constructor(upperLeftCorner: Point) {
        // Currently highwind is an equalateral triangle.
        // TODO: re-draw it to make it look more like the real ship.
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

    public cycleGun(): Projectile | null {
        this.fireProjectileOnNextTick = false;
        return super.cycleGun();
    }
}

export class Projectile extends GameObject {
    public static readonly DEFAULT_COLOR: string = "green";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "green";
    public static readonly DEFAULT_MAX_HP = 1;
    public static readonly DEFAULT_CONTACT_DAMAGE = 1;

    constructor(upperLeftCorner: Point) {
        let points: Point[] = [new Point(0, 0), new Point(0, .5), new Point(.5, .5), new Point(.5, 0)];
        let projectileShapes: Shape[] = [new Shape(points, Projectile.DEFAULT_COLOR, Projectile.DEFAULT_OUTLINE_COLOR)];
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

        /*
         * It is absolutely necessary we create a new Point. if the old Point
         * is used then when it moves anything referencing it will move along
         * with it. Ergo, if the projectile starts at the position where its
         * ship is the ship will be moved along with the projectile!
         */
        let corner = new Point(upperLeftCorner.xCoordinate, upperLeftCorner.yCoordinate);

        super(corner, projectileShapes, straightAhead);
        super.maximumHealth = Projectile.DEFAULT_MAX_HP;
        super.currentHealth = Projectile.DEFAULT_MAX_HP;
        super.contactDamage = Projectile.DEFAULT_CONTACT_DAMAGE;
    }

    public getColor() {
        return Projectile.DEFAULT_COLOR;
    }

    public getOutineColor() {
        return Projectile.DEFAULT_OUTLINE_COLOR;
    }
}

export class EnemyProjectile extends Projectile {
    projectileColor = "yellow";
    projectileOutlineColor = "yellow";
    // TODO: Actually set the colors. This isn't enough.

    constructor(upperLeftCorner: Point) {
        super(upperLeftCorner);
        // FIXME: For some reason we're getting Projectiles when GunnerBlockHead fires!
        // They're showing up (supposedly) colored green and they're keeping the default movement pattern of going backwards!
        this.movementPattern = [new Movement(0, 1, 1)];
    }

    public getColor() {
        return this.projectileColor;
    }

    public getOutlineColor() {
        return this.projectileOutlineColor;
    }
}

export class SimpleBlockHead extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "red";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "red";
    public static readonly DEFAULT_MAX_HP = 3;
    public static readonly DEFAULT_CONTACT_DAMAGE = 3;

    constructor(upperLeftCorner: Point) {
        let points: Point[] = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
        let shipShapes: Shape[] = [new Shape(points, SimpleBlockHead.DEFAULT_COLOR, SimpleBlockHead.DEFAULT_OUTLINE_COLOR)];
        let backAndForth: Movement[] = [new Movement(1, 0, 1), new Movement(1, 0, 1),
            new Movement(-1, 0, 1), new Movement(-1, 0, 1)];

        super(upperLeftCorner, shipShapes, backAndForth);
        super.maximumHealth = SimpleBlockHead.DEFAULT_MAX_HP;
        super.currentHealth = SimpleBlockHead.DEFAULT_MAX_HP;
        super.contactDamage = SimpleBlockHead.DEFAULT_CONTACT_DAMAGE;

        // SimpleBlockHeads are not capable of creating projectiles
        this.fireProjectileOnNextTick = false;
    }

    // public shouldFireProjectileOnNextTick() {
    //     return false;
    // }
}

export class GunnerBlockHead extends SimpleBlockHead {
    constructor(upperLeftCorner: Point) {
        super(upperLeftCorner);

        // GunnerBlockHeads are like SimpleBlockHeads, but they always attempt projectiles on every tick.
        this.fireProjectileOnNextTick = true;
        this.cyclesDelayBetweenShots = 0;
    }
    // They are like SimpleBlockHeads, but they always fire projectiles on every tick.
    // public shouldFireProjectileOnNextTick() {
    //     return true;
    // }

    /**
     * TODO: Consider things like limiting not just the type of projectiles and
     * the rate of fire, but also the number of shots?
     * Enemies that have powerful ammo in limited quantities? Bombs?
     */
    // What about enemies that explode on death?
    public createProjectile() {
        this.cyclesUntilNextFire = this.cyclesDelayBetweenShots;
        return new EnemyProjectile(this.upperLeftCorner);
    }
}

export class ComplexGunnerBlockHead extends SimpleBlockHead {
    constructor(upperLeftCorner: Point) {
        super(upperLeftCorner);

        this.fireProjectileOnNextTick = true;
        this.cyclesDelayBetweenShots = 3;
    }

    // // They are like SimpleBlockHeads, but they always fire projectiles on every tick.
    // public shouldFire() {
    //     if(currentTick > this.cyclesUntilNextFire + this.cyclesDelayBetweenShots) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // public createProjectile(): Projectile {
    //     // TODO: update this.lastTimeFired here.
    //     return super.createProjectile();
    // }

    /**
     * TODO: Consider things like limiting not just the type of projectiles and
     * the rate of fire, but also the number of shots?
     * Enemies that have powerful ammo in limited quantities? Bombs?
     */
    // What about enemies that explode on death?
    public createProjectile() {
        this.cyclesUntilNextFire = this.cyclesDelayBetweenShots;
        return new EnemyProjectile(this.upperLeftCorner);
    }
}