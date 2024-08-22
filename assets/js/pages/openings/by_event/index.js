import { resultEventModal } from './ResultEventModal.js';
import { binaryWebSocket } from '../../../websockets/binary/BinaryWebSocket.js';
import { dataWebSocket } from '../../../websockets/data/DataWebSocket.js';
import { analysisWebSocket } from '../../../websockets/game/AnalysisWebSocket.js';

sessionStorage.clear();

await binaryWebSocket.connect();
await dataWebSocket.connect();
await analysisWebSocket.connect();

resultEventModal.props.modal.show();
