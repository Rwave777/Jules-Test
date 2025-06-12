// script.js が読み込まれたことを示すログ (開発用)
console.log("script.js loaded");

// --- 定数 ---
const GAME_BOARD_WIDTH = 10; // ゲームボードの幅 (セル数)
const GAME_BOARD_HEIGHT = 20; // ゲームボードの高さ (セル数)

// --- HTML要素の取得 ---
const gameBoardElement = document.getElementById('game-board'); // ゲームボード表示用DIV
const scoreElement = document.getElementById('score'); // スコア表示用DIV
const nextTetrominoElement = document.getElementById('next-tetromino'); // 次のテトリミノ表示用DIV

// --- グローバル変数 ---
let board = []; // ゲームボードの状態を保持する2次元配列
let score = 0; // 現在のスコア

// 現在操作中のテトリミノに関する情報
let currentTetrominoShape = null; // 現在のテトリミノの形状 (2次元配列)
let currentTetrominoColor = ''; // 現在のテトリミノの色
let currentTetrominoType = ''; // 現在のテトリミノの種類 (例: 'L', 'T') デバッグやログ用
let currentTetrominoX = 0; // 現在のテトリミノのX座標 (ボード左上が0)
let currentTetrominoY = 0; // 現在のテトリミノのY座標 (ボード左上が0)

// 次に出現するテトリミノに関する情報
let nextTetrominoShape = null; // 次のテトリミノの形状
let nextTetrominoColor = ''; // 次のテトリミノの色
let nextTetrominoType = ''; // 次のテトリミノの種類

// --- 関数定義 ---

// 空のゲームボードを作成する関数
function createEmptyBoard() {
  for (let row = 0; row < GAME_BOARD_HEIGHT; row++) {
    board[row] = [];
    // 各行を配列で初期化
    for (let col = 0; col < GAME_BOARD_WIDTH; col++) {
      board[row][col] = 0; // 0 は空のセルを示す
    }
  }
}

// テトリミノの定義
const TETROMINOES = {
  'I': { shape: [[1, 1, 1, 1]], color: 'cyan' }, // I型
  'O': { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O型
  'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }, // L型
  'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }, // T型
  'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' }, // S型
  'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }, // Z型
  'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' } // J型
};
// テトリミノの種類名の配列 (例: ['I', 'O', 'L', ...])
const TETROMINO_TYPES = Object.keys(TETROMINOES);

// スコア表示を更新する関数
function updateScoreDisplay() {
  scoreElement.textContent = 'スコア: ' + score; // 日本語化
}

// ランダムなテトリミノを生成し、ボードの上部に配置する関数
// ※この関数は後で「次のテトリミノ」ロジックに合わせて大幅に修正されます
function spawnRandomTetromino() {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  const tetromino = TETROMINOES[type];
  currentTetrominoShape = tetromino.shape;
  currentTetrominoColor = tetromino.color;
  currentTetrominoType = type; // 種類を保存

  // テトリミノをボード中央の上端に配置
  currentTetrominoX = Math.floor((GAME_BOARD_WIDTH - currentTetrominoShape[0].length) / 2);
  currentTetrominoY = 0;

  // ログ: 生成されたテトリミノの情報
  console.log(`テトリミノ生成: タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY}), 形状=${JSON.stringify(currentTetrominoShape)}`);

  // 生成位置にテトリミノを配置できるかチェック (ゲームオーバー判定)
  if (!canPlaceTetromino(currentTetrominoShape, currentTetrominoX, currentTetrominoY)) {
    console.error("ゲームオーバー! 新しいテトリミノを配置できませんでした。最終スコア:", score);
    alert("ゲームオーバー!");
    clearInterval(gameInterval); // ゲームループを停止
    return false; // 生成失敗を示す
  }
  return true; // 生成成功を示す
}

// spawnRandomTetromino の変更イメージ
// ランダムなテトリミノを生成し、現在のテトリミノとして設定する。
// 次のテトリミノも生成・更新する。
function spawnRandomTetromino() {
  if (nextTetrominoShape === null) { // 初回呼び出し時
    // currentTetromino をランダムに生成
    const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
    const tetromino = TETROMINOES[type];
    currentTetrominoShape = tetromino.shape;
    currentTetrominoColor = tetromino.color;
    currentTetrominoType = type;
    currentTetrominoX = Math.floor((GAME_BOARD_WIDTH - currentTetrominoShape[0].length) / 2);
    currentTetrominoY = 0;
    console.log(`初回テトリミノ生成: タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY})`);
  } else { // 2回目以降の呼び出し
    // nextTetromino の情報を currentTetromino に移す
    currentTetrominoShape = nextTetrominoShape;
    currentTetrominoColor = nextTetrominoColor;
    currentTetrominoType = nextTetrominoType;
    currentTetrominoX = Math.floor((GAME_BOARD_WIDTH - currentTetrominoShape[0].length) / 2);
    currentTetrominoY = 0; // Y座標は常に0からスタート
    console.log(`次のテトリミノを現在に設定: タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY})`);
  }

  // 新しい nextTetromino をランダムに生成
  const nextType = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  const nextTetrominoData = TETROMINOES[nextType];
  nextTetrominoShape = nextTetrominoData.shape;
  nextTetrominoColor = nextTetrominoData.color;
  nextTetrominoType = nextType; // 次のテトリミノのタイプも保存
  console.log(`新しい次のテトリミノ生成: タイプ=${nextTetrominoType}`);

  drawNextTetromino(); // 次のテトリミノ表示を更新

  // 現在のテトリミノが配置可能かチェック (ゲームオーバー判定)
  if (!canPlaceTetromino(currentTetrominoShape, currentTetrominoX, currentTetrominoY)) {
    console.error(`ゲームオーバー! 新しいテトリミノ (${currentTetrominoType}) を配置できませんでした。最終スコア: ${score}`);
    alert("ゲームオーバー!");
    clearInterval(gameInterval);
    return false; // スポーン失敗
  }
  return true; // スポーン成功
}


// 指定された位置にテトリミノが配置可能かどうかを判定する関数
function canPlaceTetromino(shape, x, y) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) { // テトリミノのブロックがある部分のみチェック
        const boardX = x + col; // ボード上でのX座標
        const boardY = y + row; // ボード上でのY座標

        // ボードの範囲外かどうかチェック
        if (boardX < 0 || boardX >= GAME_BOARD_WIDTH || boardY >= GAME_BOARD_HEIGHT) {
          return false; // 衝突: ボード範囲外
        }
        // 他のブロックと衝突するかどうかチェック (ボードのセルが0でないか)
        // boardY < 0 の場合は、ボードの上にはみ出ているが、そこは空きとみなす（まだ落下中なので）
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return false; // 衝突: 他ブロックあり
        }
      }
    }
  }
  return true;
}

// 現在のテトリミノを回転させる関数
function rotateCurrentTetromino() {
  if (!currentTetrominoShape) return false; // 操作対象のテトリミノがない場合は何もしない

  const originalShape = currentTetrominoShape; // 回転前の形状をログ用に保存
  const originalX = currentTetrominoX; // 回転前のX座標をログ用に保存
  const originalY = currentTetrominoY; // 回転前のY座標をログ用に保存

  const shape = currentTetrominoShape;
  const rows = shape.length;
  const cols = shape[0].length;
  const newShape = []; // 回転後の新しい形状を格納する配列
  // 回転ロジック: 行と列を入れ替え、新しい行を逆順にする (右90度回転)
  for (let j = 0; j < cols; j++) {
    newShape[j] = [];
    for (let i = rows - 1; i >= 0; i--) {
      newShape[j].push(shape[i][j]);
    }
  }

  let rotated = false;
  // 回転後の形状で配置可能かチェック
  if (canPlaceTetromino(newShape, currentTetrominoX, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    rotated = true;
  // 壁キックのようなものを試みる (左に1つずらして配置可能か)
  } else if (canPlaceTetromino(newShape, currentTetrominoX - 1, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    currentTetrominoX--;
    rotated = true;
  // 壁キックのようなものを試みる (右に1つずらして配置可能か)
  } else if (canPlaceTetromino(newShape, currentTetrominoX + 1, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    currentTetrominoX++;
    rotated = true;
  }
  // TODO: より高度な壁キックルール (SRSなど) を実装する場合はここを拡張

  if (rotated) {
    console.log(`プレイヤー操作: 回転, タイプ=${currentTetrominoType}, 旧位置=(${originalX},${originalY}), 新位置=(${currentTetrominoX},${currentTetrominoY}), 新形状=${JSON.stringify(currentTetrominoShape)}`);
    return true;
  } else {
    console.log(`プレイヤー操作: 回転 (失敗), タイプ=${currentTetrominoType}, 位置=(${originalX},${originalY}), 形状=${JSON.stringify(originalShape)}`);
    return false;
  }
}

// ゲームボードと現在操作中のテトリミノを描画する関数
function drawBoard() {
  gameBoardElement.innerHTML = ''; // 描画前にボードをクリア
  // ボードの状態をコピーして、現在操作中のテトリミノを一時的に合成する
  let displayBoard = board.map(row => [...row]);

  // 現在操作中のテトリミノが存在する場合、それをdisplayBoardに描画する
  if (currentTetrominoShape) {
    for (let row = 0; row < currentTetrominoShape.length; row++) {
      for (let col = 0; col < currentTetrominoShape[row].length; col++) {
        if (currentTetrominoShape[row][col] !== 0) {
          // テトリミノのブロックがボードの上端より上にある場合でも描画する（Y座標が負の場合）
          if (currentTetrominoY + row >= 0) {
             displayBoard[currentTetrominoY + row][currentTetrominoX + col] = currentTetrominoColor;
          }
        }
      }
    }
  }

  // displayBoard を元にHTML要素を生成して画面に表示
  for (let row = 0; row < GAME_BOARD_HEIGHT; row++) {
    for (let col = 0; col < GAME_BOARD_WIDTH; col++) {
      const cell = document.createElement('div');
      cell.classList.add('block'); // style.cssで定義された基本セルスタイル
      if (displayBoard[row][col] !== 0) {
        // 固定されたブロックまたは現在操作中のテトリミノのブロック
        cell.style.backgroundColor = displayBoard[row][col]; // テトリミノの色を適用
        cell.classList.add('tetromino-piece'); // style.cssで定義されたテトリミノピーススタイル
      }
      // それ以外の場合は空セルとなり、.block スタイルのみが適用される
      gameBoardElement.appendChild(cell);
    }
  }
}

// 次のテトリミノ表示エリアを更新する関数
function drawNextTetromino() {
  nextTetrominoElement.innerHTML = ''; // 描画前にクリア
  if (!nextTetrominoShape) return; // 次のテトリミノがない場合は何もしない

  // テトリミノの形状に合わせてオフセットを計算し、4x4のグリッド中央に表示
  const shape = nextTetrominoShape;
  const shapeHeight = shape.length;
  const shapeWidth = shape[0].length;

  // 4x4 グリッドの中央に配置するためのオフセット
  // (4 - 実際の幅/高さ) / 2 を切り捨て
  const offsetX = Math.floor((4 - shapeWidth) / 2);
  const offsetY = Math.floor((4 - shapeHeight) / 2);

  for (let row = 0; row < shapeHeight; row++) {
    for (let col = 0; col < shapeWidth; col++) {
      if (shape[row][col] !== 0) { // テトリミノのブロック部分のみ描画
        const block = document.createElement('div');
        block.classList.add('block'); // 基本的なブロックスタイル
        // block.classList.add('tetromino-piece'); // 枠線などが必要な場合、メインボードと同じクラスを使うか専用クラスを作る
        block.style.backgroundColor = nextTetrominoColor; // 次のテトリミノの色
        // CSS Grid を使って配置 (style.cssで #next-tetromino が grid になっている前提)
        block.style.gridRowStart = row + 1 + offsetY;
        block.style.gridColumnStart = col + 1 + offsetX;
        nextTetrominoElement.appendChild(block);
      }
    }
  }
}


// ラインが揃ったか確認し、揃っていれば消去してスコアを加算する関数
function clearLines() {
  let linesClearedThisTurn = 0; // このターンで消去したライン数
  for (let y = GAME_BOARD_HEIGHT - 1; y >= 0; y--) {
    // 行がすべて0でないブロックで埋まっているかチェック
    if (board[y].every(cell => cell !== 0)) {
      linesClearedThisTurn++;
      board.splice(y, 1); // その行を削除
      board.unshift(Array(GAME_BOARD_WIDTH).fill(0)); // 新しい空の行を一番上に追加
      y++; // splice で配列のインデックスがずれるため、同じyを再チェック
    }
  }
  if (linesClearedThisTurn > 0) {
    // 消したライン数に応じてスコアを加算 (例: 1ライン100点, 2ライン300点, 3ライン500点, 4ライン(テトリス)800点 のような感じにしたい場合は調整)
    // ここでは単純にライン数 x 100 x ライン数乗で計算
    score += linesClearedThisTurn * 100 * linesClearedThisTurn;
    updateScoreDisplay(); // スコア表示を更新
    console.log(`${linesClearedThisTurn} ライン消去！ 新スコア=${score}`);
  }
}

// ゲームのメインループ (ティック) ごとに呼び出される関数
function gameTick() {
  // const prevX = currentTetrominoX; // ロック時のログ用 (ハードドロップに移動)
  // const prevY = currentTetrominoY;

  // 現在のテトリミノが存在し、かつ1つ下に移動可能か
  if (currentTetrominoShape && canPlaceTetromino(currentTetrominoShape, currentTetrominoX, currentTetrominoY + 1)) {
    currentTetrominoY++; // 1つ下に移動
  } else {
    // テトリミノがこれ以上下に移動できない場合 (地面または他のブロックに到達)
    if (currentTetrominoShape) {
      // 操作中のテトリミノが存在すれば、それをボードに固定する
      for (let row = 0; row < currentTetrominoShape.length; row++) {
        for (let col = 0; col < currentTetrominoShape[row].length; col++) {
          if (currentTetrominoShape[row][col] !== 0) {
            // テトリミノがボードの上端より上で固定される場合 (Y座標が負) はゲームオーバー
            if (currentTetrominoY + row < 0) {
              console.error(`ゲームオーバー! テトリミノがボード上部で固定されました。タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY})。最終スコア: ${score}`);
              alert("ゲームオーバー！ブロックが最上部で固定されました。");
              clearInterval(gameInterval); // ゲームループを停止
              return; // ゲームオーバーなので以降の処理は行わない
            }
            board[currentTetrominoY + row][currentTetrominoX + col] = currentTetrominoColor;
          }
        }
      }
      console.log(`テトリミノ固定: タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY}), 形状=${JSON.stringify(currentTetrominoShape)}`);
      currentTetrominoShape = null; // 現在のテトリミノをクリア (固定したので操作対象ではなくなる)
      clearLines(); // ライン消去処理
      // スコア更新は clearLines の中で行われる
    }

    // 新しいテトリミノをスポーンする
    // spawnRandomTetromino は current と next を更新し、drawNextTetromino も内部で呼ぶ
    if (!spawnRandomTetromino()) {
      // ゲームオーバーメッセージは spawnRandomTetromino 内で処理されるので、ここでは追加の処理は不要
      // ただし、ゲームオーバーになったら gameTick はもう呼ばれないように clearInterval されているはず
      drawBoard(); // ゲームオーバー時の盤面最終状態を描画
      return; // ゲームオーバーならここで終了
    }
  }
  drawBoard(); // ボード全体を再描画 (落下中または新しいテトリミノの初期位置)
}

// ハードドロップ処理を行う関数
function handleHardDrop() {
  if (!currentTetrominoShape) return; // 操作対象のテトリミノがない場合は何もしない

  const originalX = currentTetrominoX; // ログ用
  const originalY = currentTetrominoY;

  let potentialY = currentTetrominoY;
  // 1段ずつ下に移動可能かチェックし、最終的なY座標を見つける
  while (canPlaceTetromino(currentTetrominoShape, currentTetrominoX, potentialY + 1)) {
    potentialY++;
  }

  currentTetrominoY = potentialY; // テトリミノを一番下まで移動

  // テトリミノをボードに固定 (gameTickのロック処理とほぼ同じ)
  for (let row = 0; row < currentTetrominoShape.length; row++) {
    for (let col = 0; col < currentTetrominoShape[row].length; col++) {
      if (currentTetrominoShape[row][col] !== 0) {
        if (currentTetrominoY + row < 0) { // 通常は起こらないはずだが念のため
          console.error(`ゲームオーバー！(ハードドロップ時) テトリミノがボード上部に固定されました。タイプ=${currentTetrominoType}, 位置=(${currentTetrominoX},${currentTetrominoY}). 最終スコア: ${score}`);
          alert("ゲームオーバー！ブロックが最上部で固定されました。");
          clearInterval(gameInterval);
          return;
        }
        board[currentTetrominoY + row][currentTetrominoX + col] = currentTetrominoColor;
      }
    }
  }
  console.log(`テトリミノ固定 (ハードドロップ): タイプ=${currentTetrominoType}, 旧位置=(${originalX},${originalY}), 新位置=(${currentTetrominoX},${currentTetrominoY})`);

  currentTetrominoShape = null; // テトリミノをクリア
  clearLines(); // ライン消去とスコア更新
  // updateScoreDisplay(); // clearLines内で呼ばれる

  // 新しいテトリミノをスポーン (current と next を更新し、drawNextTetromino も呼ぶ)
  if (!spawnRandomTetromino()) {
    drawBoard(); // ゲームオーバー時の盤面を描画
    return; // ゲームオーバーなら終了
  }
  // spawnRandomTetromino が成功した場合、新しい currentTetromino がセットされ、nextTetromino も更新されている
  // drawNextTetromino も spawnRandomTetromino 内部で呼ばれている

  drawBoard(); // 新しいテトリミノを含めて盤面全体を再描画
}


// --- ゲーム初期化処理 ---
console.log("ゲーム開始処理中...");
createEmptyBoard(); // まず空のボードを作成
updateScoreDisplay(); // 初期スコア表示 (0点)
console.log("ゲームボード初期化完了:", JSON.parse(JSON.stringify(board))); // 初期状態のボードをログに出力 (ディープコピー)

// 初回のテトリミノ生成 (current と next の両方をセット)
if (spawnRandomTetromino()) {
    drawBoard(); // 初期盤面を描画 (最初のカレントテトリミノ含む)
    // drawNextTetromino(); // spawnRandomTetromino の中で呼ばれるのでここでは不要
    console.log("ゲームが正常に開始されました。");
} else {
    // spawnRandomTetromino が false を返した場合、ゲームオーバー処理が内部で行われているはず
    console.error("スポーン失敗によりゲームを開始できませんでした。");
    // 必要であれば、ここでゲームオーバー画面の表示などを明示的に行う
}

// --- ゲームループの開始 ---
const GAME_SPEED = 1000; // ゲームの速度 (ミリ秒単位、小さいほど速い)
let gameInterval = setInterval(gameTick, GAME_SPEED); // 指定された間隔でgameTickを実行

// --- イベントリスナー設定 (キーボード操作) ---
document.addEventListener('keydown', (event) => {
  // ゲームオーバー後やテトリミノがない場合は操作を無視 (handleHardDropなども同様のチェックを持つ)
  if (!currentTetrominoShape) return;

  const prevX = currentTetrominoX; // 操作前のX座標 (ログ用)
  const prevY = currentTetrominoY; // 操作前のY座標 (ログ用)
  let action = ''; // プレイヤーのアクションを示す文字列 (ログ用)
  let moved = false; // テトリミノが実際に移動または回転したか

  try {
    if (event.key === 'ArrowLeft' || event.code === 'ArrowLeft') {
      action = '左移動';
      if (canPlaceTetromino(currentTetrominoShape, currentTetrominoX - 1, currentTetrominoY)) {
        currentTetrominoX--;
        moved = true;
      }
    } else if (event.key === 'ArrowRight' || event.code === 'ArrowRight') {
      action = '右移動';
      if (canPlaceTetromino(currentTetrominoShape, currentTetrominoX + 1, currentTetrominoY)) {
        currentTetrominoX++;
        moved = true;
      }
    } else if (event.key === 'ArrowDown' || event.code === 'ArrowDown') {
      action = 'ソフトドロップ';
      // ソフトドロップ: gameTickを直接呼び出して1段落下させる
      // gameTick内で移動、固定、次のテトリミノ生成、描画まで行われる
      console.log(`プレイヤー操作: ${action} 開始, タイプ=${currentTetrominoType}, 位置=(${prevX},${prevY})`);
      gameTick();
      // gameTickがdrawBoardを呼ぶので、ここでは追加のdrawBoardは不要
      return; // 他のキー操作後の共通描画処理をスキップ
    } else if (event.key === 'ArrowUp' || event.code === 'ArrowUp') {
      action = '回転';
      // rotateCurrentTetromino は内部で成功/失敗のログを出力し、movedフラグのようにtrue/falseを返す
      moved = rotateCurrentTetromino();
    } else if (event.code === 'Space' || event.key === ' ') { // スペースキーでハードドロップ
      event.preventDefault(); // スペースキーのデフォルト動作 (ページスクロールなど) を抑制
      action = 'ハードドロップ';
      console.log(`プレイヤー操作: ${action} 開始, タイプ=${currentTetrominoType}, 位置=(${prevX},${prevY})`);
      handleHardDrop();
      // handleHardDrop内で盤面描画(drawBoard)と次のテトリミノ描画(drawNextTetromino via spawnRandomTetromino)が行われるので、ここでは不要
      return; // 他のキー操作後の共通描画処理をスキップ
    }

    // 移動・回転操作が行われた場合のログ (ソフトドロップとハードドロップは独自のログとリターンを持つ)
    if (moved && action !== '回転') { // 回転はrotateCurrentTetromino内で詳細ログ
      console.log(`プレイヤー操作: ${action}, タイプ=${currentTetrominoType}, 旧位置=(${prevX},${prevY}), 新位置=(${currentTetrominoX},${currentTetrominoY})`);
    } else if (!moved && action !== '' && action !== '回転') { // actionがあり、回転でもなく、移動失敗した場合
      console.log(`プレイヤー操作: ${action} (失敗), タイプ=${currentTetrominoType}, 位置=(${prevX},${prevY})`);
    }

    // 移動または回転が成功した場合、盤面を再描画
    // (ソフトドロップとハードドロップはこのブロックの前にreturnされる)
    if (moved) {
      drawBoard();
    }
  } catch (error) {
    // 不明なエラーが発生した場合のログ
    console.error(`プレイヤー操作 (${action}) 中にエラー発生:`, error, {
      tetrominoType: currentTetrominoType,
      position: `(${prevX},${prevY})`,
      shape: currentTetrominoShape
    });
  }
});
