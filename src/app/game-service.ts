import { Injectable } from '@angular/core';

@Injectable()
export class GameService {

    // TODO: Remove this class.
    getEmptyBoard(rows: number, columns: number): number[][] {
        return Array.from({ length: rows }, () => Array(columns).fill(0));
    }
}