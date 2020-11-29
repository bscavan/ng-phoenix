import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { COLS, BLOCK_SIZE, ROWS } from '../constants';
import { Piece } from './piece';
import { GameService } from '../game-service';
import { KeyCodes } from './KeyCodes';
import { IPiece } from './IPiece';
import { Point, ShipPiece, Highwind } from './ship-piece';
import { isNull } from 'util';
import { CustomCanvas } from './custom-canvas';

@Component({
  selector: 'game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  // Get reference to the canvas.
  @ViewChild('board', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  //ctx: CanvasRenderingContext2D;
  gameCanvas: CustomCanvas;
  points: number;
  lines: number;
  level: number;
  //board: number[][];
  //piece: Piece;
  ship: ShipPiece;
  startPosition: Point = new Point(5, 2);

  moves = {
    [KeyCodes.LEFT]:  (p: IPiece): IPiece => ({ ...p, x: p.x - 1 }),
    [KeyCodes.RIGHT]: (p: IPiece): IPiece => ({ ...p, x: p.x + 1 }),
    [KeyCodes.UP]:    (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KeyCodes.DOWN]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
  };

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
    this.ship = new Highwind(this.startPosition)
  }

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

    // This can be modified with a "speed"
    let moveStep = 1;
    let currentPosition = this.ship.upperLeftCorner;

    switch(event.keyCode) {
      // TODO: event.preventDefault();
      case KeyCodes.LEFT:
        newPoint = new Point(currentPosition.xCoordinate- moveStep, currentPosition.yCoordinate);
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

    // FIXME: This doesn't allow for layering canvas objects...
    if(isNull(newPoint) == false) {
        this.gameCanvas.erase(this.ship);

        this.ship.moveToPoint(newPoint);

        this.gameCanvas.draw(this.ship);
    }
  }
}