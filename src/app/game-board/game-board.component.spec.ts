import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameBoardComponent } from './game-board.component';
import { GameService } from '../game-service';
import { Point, Shape } from './ship-piece';
import { GameObject, Movement, SingleMoveGameObject } from './game-object';

export class TestGameObject extends GameObject {
  public static readonly DEFAULT_COLOR: string = "red";
  public static readonly DEFAULT_OUTLINE_COLOR: string = "red";

  constructor(upperLeftCorner: Point) {
      let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
      let shipShapes: Shape[] = [new Shape(points, TestGameObject.DEFAULT_COLOR, TestGameObject.DEFAULT_OUTLINE_COLOR)];
      let backAndForth: Movement[] = [new Movement(3, 0, 3), new Movement(0, 3, 3),
          new Movement(-3, 0, 3), new Movement(0, -3, 3)];

      super(upperLeftCorner, shipShapes, backAndForth);
  }
}

export class TestSingleMoveGameObject extends SingleMoveGameObject {
  public static readonly DEFAULT_COLOR: string = "red";
  public static readonly DEFAULT_OUTLINE_COLOR: string = "red";

  constructor(upperLeftCorner: Point) {
      let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
      let shipShapes: Shape[] = [new Shape(points, TestGameObject.DEFAULT_COLOR, TestGameObject.DEFAULT_OUTLINE_COLOR)];

      super(upperLeftCorner, shipShapes, []);
  }
}

describe('GameBoardComponent', () => {
  let component: GameBoardComponent;
  let fixture: ComponentFixture<GameBoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameBoardComponent ],
      providers: [
        GameService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should move registered GameObject each tick.', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(1);
    component.addGameObject(testBlockHead, 1);

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();
  });

  it('should handle increased timeFactor when moving GameObject.', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(3);
    component.addGameObject(testBlockHead, 1);

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();
  });

  it('should handle increased, nondivisible, timeFactor when moving GameObject.', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(2);
    component.addGameObject(testBlockHead, 1);

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();
  });

  it('should handle decreased, nondivisible, timeFactor when moving GameObject.', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(.5);
    // TODO: Rework these assertions to ensure we only move half as often here!
    component.addGameObject(testBlockHead, 1);

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + .5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1.5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2.5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + .5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1.5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2.5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2.5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1.5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 1);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + .5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 3);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2.5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1.5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + .5);

    component.executeWorldTick();

    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();
  });

  it('should execute nextMove() correctly on SingleMoveGameObject with a single-second move', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestSingleMoveGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(1);
    component.addGameObject(testBlockHead, 1);

    // Assert the ship begins where we told it to.
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    // Assert that, without any values in movementPattern, testBlockHead doesn't move.
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    // Test using addMovement to add a single, one-second (in gameTime) movement to testBlockHead here
    expect(testBlockHead.movementPattern.length).toEqual(0);
    testBlockHead.addMovement(new Movement(3, 2, 1));
    expect(testBlockHead.movementPattern.length).toEqual(1);
    expect(testBlockHead.timeIntoCurrentMove).toEqual(0);

    component.executeWorldTick();

    // Assert that the position has changed
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 3);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    // Assert that testBlockHead.movementPattern has a length of 0 and a timeIntoCurrentMove of 0.
    // (Because executing the full movement removed them.)
    expect(testBlockHead.movementPattern.length).toEqual(0);
    expect(testBlockHead.timeIntoCurrentMove).toEqual(0);
  });

  it('should execute nextMove() correctly on SingleMoveGameObject with a multi-second move', () => {
    // Overwrite GameBoardComponent.startGameClock() so it doesn't execute
    // extra world ticks that would interfere with this test.
    component.startGameClock = () => {};

    let startingX = 0;
    let startingY = 0;

    let testBlockHead = new TestSingleMoveGameObject(new Point(0, 0));
    testBlockHead.setTimeFactor(1);
    component.addGameObject(testBlockHead, 1);

    // Assert the ship begins where we told it to.
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    component.executeWorldTick();

    // Assert that, without any values in movementPattern, testBlockHead doesn't move.
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY);

    expect(testBlockHead.movementPattern.length).toEqual(0);

    // Test using addMovement to add a single, two-second (in gameTime),
    // multiple unit (of distance) movement to testBlockHead here.
    testBlockHead.addMovement(new Movement(5, 2, 2));

    // Assert that testBlockHead.movementPattern has a length of 0 and a timeIntoCurrentMove of 0.
    expect(testBlockHead.movementPattern.length).toEqual(1);
    expect(testBlockHead.timeIntoCurrentMove).toEqual(0);

    component.executeWorldTick();

    // Assert that the position has changed
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 2.5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 1);

    // Assert that testBlockHead.movementPattern still has a length of 1 and now has a timeIntoCurrentMove of 1.
    // (Because the full movement has not yet been executed.)
    expect(testBlockHead.movementPattern.length).toEqual(1);
    expect(testBlockHead.timeIntoCurrentMove).toEqual(1);

    component.executeWorldTick();

    // Assert that the position has changed
    expect(testBlockHead.upperLeftCorner.xCoordinate).toEqual(startingX + 5);
    expect(testBlockHead.upperLeftCorner.yCoordinate).toEqual(startingY + 2);

    // Assert that testBlockHead.movementPattern has a length of 0 and a timeIntoCurrentMove of 0.
    // (Because executing the full movement removed them.)
    expect(testBlockHead.movementPattern.length).toEqual(0);
    expect(testBlockHead.timeIntoCurrentMove).toEqual(0);



    // THIRD TEST HERE:

    // Add multiple movements using addMovement()
    // Assert between ticks that they are executed in order.
    // Monkey around with timeFactor to ensure that doesn't break anything?



    // FOURTH TEST HERE:

    // Add some movements using addMovement.
    // Get partway through one of the movements.
    // Use testBlockHead.overwriteNextMove() to erase the old moves and replace
    // them with a new one that will take multiple ticks.
    // execute a tick
    // Assert that the old moves weren't executed and the new one was.
    // Assert that movementPattern only contains the new move.
  });
});
