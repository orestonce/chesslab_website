import { COLOR, INPUT_EVENT_TYPE, MARKER_TYPE } from '@chesslablab/cmblab';
import chessboard from './pages/chessboard.js';
import { infoModal } from './pages/InfoModal.js';
import { progressModal } from './pages/ProgressModal.js';

export default class AbstractWebSocket {
  _progressModal;

  _infoModal;

  _chessboard;

  constructor() {
    this._progressModal = progressModal;

    this._infoModal = infoModal;

    this._chessboard = chessboard;

    this._chessboard.enableMoveInput(event => {
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

    this.socket = null;
  }

  send(msg) {
    if (this.socket) {
      this.socket.send(msg);
    }
  }

  _end() {
    chessboard.state.inputWhiteEnabled = false;
    chessboard.state.inputBlackEnabled = false;
  }

  _infoEnd(res) {
    if (res.isMate) {
      this._infoModal.props.msg = res.turn === COLOR.black ? 'White wins' : 'Black wins';
      this._infoModal.mount();
      this._infoModal.props.modal.show();
      this._end();
      return true;
    } else if (res.isFivefoldRepetition) {
      this._infoModal.props.msg = "Draw by fivefold repetition";
      this._infoModal.mount();
      this._infoModal.props.modal.show();
      this._end();
      return true;
    }

    return false;
  }
}
