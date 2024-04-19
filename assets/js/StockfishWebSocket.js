import { COLOR, FEN, INPUT_EVENT_TYPE, MARKER_TYPE } from '@chesslablab/cmblab';
import chessboard from './pages/chessboard.js';
import { gameActionsDropdown } from './pages/GameActionsDropdown.js';
import sanMovesBrowser from './pages/sanMovesBrowser.js';
import openingTable from './pages/openingTable.js';
import { progressModal } from './pages/ProgressModal.js';
import * as env from '../env.js';
import * as mode from '../mode.js';
import * as variant from '../variant.js';

export class StockfishWebSocket {
  constructor() {
    chessboard.enableMoveInput((event) => {
      if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
        return;
      }

      if (event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
        event.chessboard.removeMarkers(MARKER_TYPE.dot);
        event.chessboard.removeMarkers(MARKER_TYPE.bevel);
      }

      if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        this.send(`/legal ${event.square}`);
        return true;
      } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        this.send(`/play_lan ${event.piece.charAt(0)} ${event.squareFrom}${event.squareTo}`);
        return true;
      }
    });

    gameActionsDropdown.props.ul.children.item(0).addEventListener('click', (event) => {
      event.preventDefault();
      this.send('/undo');
      this.send('/undo');
    });

    this.socket = null;
  }

  connect() {
    progressModal.props.modal.show();

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(`${env.WEBSOCKET_SCHEME}://${env.WEBSOCKET_HOST}:${env.WEBSOCKET_PORT}`);

      this.socket.onopen = () => {
        progressModal.props.modal.hide();
        resolve();
      };

      this.socket.onmessage = (res) => {
        const data = JSON.parse(res.data);
        const msg = Object.keys(data)[0];
        switch (true) {
          case 'error' === msg:
            console.log('Whoops! Something went wrong.');
            break;

          case '/start' === msg:
            chessboard.setPosition(data['/start'].fen, true);
            if (data['/start'].color === COLOR.black) {
              chessboard.setOrientation(COLOR.black);
            }
            if (data['/start'].fen.split(' ')[1] !== data['/start'].color) {
              this.send(`/stockfish "{\\"Skill Level\\":${sessionStorage.getItem('skillLevel')}}" "{\\"depth\\":12}"`);
            }
            break;

          case '/legal' === msg:
            Object.keys(data['/legal'].fen).forEach(key => {
              chessboard.addMarker(MARKER_TYPE.dot, key);
            });
            break;

          case '/play_lan' === msg:
            if (data['/play_lan'].isValid) {
              chessboard.setPosition(data['/play_lan'].fen, true);
              sanMovesBrowser.current = sanMovesBrowser.props.fen.length;
              sanMovesBrowser.props.movetext = data['/play_lan'].movetext;
              sanMovesBrowser.props.fen = sanMovesBrowser.props.fen.concat(data['/play_lan'].fen);
              sanMovesBrowser.mount();
              openingTable.props.movetext = data['/play_lan'].movetext;
              openingTable.mount();
              this.send(`/stockfish "{\\"Skill Level\\":${sessionStorage.getItem('skillLevel')}}" "{\\"depth\\":12}"`);
            } else {
              chessboard.setPosition(data['/play_lan'].fen, false);
            }
            break;

          case '/undo' === msg:
            chessboard.setPosition(data['/undo'].fen, true);
            if (!data['/undo'].movetext) {
              chessboard.state.inputWhiteEnabled = true;
              chessboard.state.inputBlackEnabled = false;
            }
            sanMovesBrowser.current -= 1;
            sanMovesBrowser.props.fen.splice(-1);
            sanMovesBrowser.props.movetext = data['/undo'].movetext;
            sanMovesBrowser.mount();
            openingTable.props.movetext = data['/undo'].movetext;
            openingTable.mount();
            break;

          case '/stockfish' === msg:
            chessboard.setPosition(data['/stockfish'].fen, true);
            sanMovesBrowser.current = sanMovesBrowser.props.fen.length;
            sanMovesBrowser.props.movetext = data['/stockfish'].movetext;
            sanMovesBrowser.props.fen = sanMovesBrowser.props.fen.concat(data['/stockfish'].fen);
            sanMovesBrowser.mount();
            openingTable.props.movetext = data['/stockfish'].movetext;
            openingTable.mount();
            break;

          case '/randomizer' === msg:
            chessboard.state.inputWhiteEnabled = false;
            chessboard.state.inputBlackEnabled = false;
            if (data['/randomizer'].turn === COLOR.white) {
              chessboard.state.inputWhiteEnabled = true;
            } else {
              chessboard.state.inputBlackEnabled = true;
            }
            sessionStorage.setItem('skillLevel', 20);
            sessionStorage.setItem('depth', 12);
            const add = {
              color: data['/randomizer'].turn,
              fen: data['/randomizer'].fen
            };
            this.send(`/start ${variant.CLASSICAL} ${mode.STOCKFISH} "${JSON.stringify(add).replace(/"/g, '\\"')}"`);
            break;

          default:
            break;
        }
      };

      this.socket.onclose = (err) => {
        console.log('The connection has been lost, please reload the page.');
        reject(err);
      };

      this.socket.onerror = (err) => {
        console.log('The connection has been lost, please reload the page.');
        reject(err);
      };
    });
  }

  send(msg) {
    if (this.socket) {
      this.socket.send(msg);
    }
  }
}

export const stockfishWebSocket = new StockfishWebSocket();
