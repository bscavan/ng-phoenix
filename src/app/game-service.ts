import { Injectable } from '@angular/core';

@Injectable()
export class GameService {

    getEmptyBoard(rows: number, columns: number): number[][] {
        return Array.from({ length: rows }, () => Array(columns).fill(0));
    }
}