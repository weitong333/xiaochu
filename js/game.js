(function () {
            var Row = 10;
            var Col = 10;
            var gameBoard = []; //游戏的数据结构 
            var gridCount = 0;  

            //游戏中每格元素的构造函数
            var Grid = function () {
                var num; //元素的种类
                var state; //元素的状态----元素是否可以被删除
                var tempState;
                var id = ++gridCount; //元素的唯一标识符
                var moveCount = 0; //其他元素填充该位置时需移动的单位数
                var isNew = true;  //表示元素是否是新生成的

                this.isNew = function () {
                    return isNew;
                }

                this.clearNew = function () {
                    isNew = false;
                }

                this.addMoveCount = function () {
                    moveCount++;
                }

                this.getMoveCount = function () {
                    return moveCount;
                }

                this.setMoveCount = function (c) {
                    moveCount = c;
                }

                this.clearMoveCount = function () {
                    moveCount = 0;
                }

                this.moveable = function () {
                    return moveCount > 0 || isNew;
                }

                this.writeState = function () {
                    tempState && (state = tempState);
                }

                this.isRemoveable = function () {
                    return state == 1;
                }

                this.setTempState = function () {
                    tempState = 1;
                }

                this.restoreTempState = function () {
                    tempState = 0;
                }

                this.setNumber = function (n) {
                    num = n;
                }

                this.getNumber = function () {
                    return num;
                }

                this.getID = function () {
                    return id;
                }
            }

            
            function GridGameStruct() {

                var statistics = {};

                var addStatistics = function (length) {
                    if (statistics[length]) {
                        statistics[length] += 1;
                    } else {
                        statistics[length] = 1;
                    }
                }

                this.getStatistics = function () {
                    return statistics;
                }

                //初始化表示游戏数据结构的二维数组
                this.initBoard = function () {
                    for (var i = 0; i < Row; i++) {
                        gameBoard[i] = [];
                        for (var j = 0; j < Col; j++) {
                            gameBoard[i][j] = randomGrid();
                        }
                    }
                }
                
                var getContinuous = function (list, field) {
                    var result = [];
                    var tempResult = [];
                    var prev;
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if (prev == null) {
                            prev = item;
                            tempResult.push(item);
                        } else {
                            if (item[field] - prev[field] == 1) {
                                tempResult.push(item);
                            } else {
                                if (tempResult.length >= 3) {
                                    result = result.concat(tempResult);
                                    addStatistics(tempResult.length);
                                }
                                tempResult = [item];
                            }
                            prev = item;
                        }
                    }

                    if (tempResult.length >= 3) {
                        result = result.concat(tempResult);
                        addStatistics(tempResult.length);
                    }

                    return result;
                }

                var getContinuousGroup = function (list) {
                    var groupsX = {};
                    var groupsY = {};
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        //横
                        if (!groupsX[item.i]) {
                            groupsX[item.i] = [];
                        }
                        groupsX[item.i].push(item);
                        //纵
                        if (!groupsY[item.j]) {
                            groupsY[item.j] = [];
                        }
                        groupsY[item.j].push(item);
                    }

                    var results = [];
                    
                    //将横向的数据按照排序函数进行排序并存入结果中
                    for (var key in groupsX) {
                        var array = groupsX[key];
                        array.sort(function (a, b) {
                            return a.j - b.j;
                        });
                        results = results.concat(getContinuous(array, 'j'));
                    }

                    for (var key in groupsY) {
                        var array = groupsY[key];
                        array.sort(function (a, b) {
                            return a.i - b.i;
                        });
                        results = results.concat(getContinuous(array, 'i'));
                    }

                    return results;
                }

                //获得游戏界面上的每一块元素及位置
                var group = function (gameBoard) {
                    statistics = {};
                    var groups = {};
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            var grid = gameBoard[i][j];
                            if (!groups[grid.getNumber()]) {
                                groups[grid.getNumber()] = [];
                            }
                            groups[grid.getNumber()].push({
                                grid: grid,
                                i: i, 
                                j: j
                            });
                        }
                    }
                    return groups;
                }

                //删除
                this.remove = function () {
                    var groups = group(gameBoard);
                    var gridMap = {};
                    var grids = [];//存储删除后的结构
                    for (var key in groups) {
                        var list = getContinuousGroup(groups[key]);
                        for (var i = 0; i < list.length; i++) {
                            var item = list[i];
                            var grid = item.grid;
                            grid.setTempState();
                            grid.writeState();
                            gridMap[grid.getID()] = grid;
                            gameBoard[item.i][item.j] = null;
                        }
                    }

                    for (var key in gridMap) {
                        grids.push(gridMap[key]);
                    }
                    return grids;
                }
                
                //测试游戏中两个元素之间互相交换位置后是否出现了满足消除要求的情况
                this.testContinuable = function (board, pos, testPos) {
                	//出界
                    if (testPos.i < 0 || testPos.i > Row - 1 || testPos.j < 0 || testPos.j > Col - 1) {
                        return false;
                    }
                    
                    var grid = board[pos.i][pos.j];
                    var testGrid = board[testPos.i][testPos.j];

                    //先交换位置
                    board[pos.i][pos.j] = testGrid;
                    board[testPos.i][testPos.j] = grid;

                    var groups = group(board);
                    for (var key in groups) {
                        var list = getContinuousGroup(groups[key]);
                        if (list.length > 0) {
                            //把位置换回来
                            board[testPos.i][testPos.j] = testGrid;
                            board[pos.i][pos.j] = grid;
                            return true;
                        }
                    }
                    //把位置换回来
                    board[testPos.i][testPos.j] = testGrid;
                    board[pos.i][pos.j] = grid;
                    return false;
                }
                
                //判断当前局面是否是死局
                this.continuable = function () {
                    var posClone = [];
                    for (var i = 0; i < Row; i++) {
                        posClone[i] = [];
                        for (var j = 0; j < Col; j++) {
                            posClone[i][j] = gameBoard[i][j];
                        }
                    }
                    //log( posClone );

                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                        	var self = { i: i, j: j };
                            var leftPos = { i: i, j: j - 1 };
                            var rightPos = { i: i, j: j + 1 };
                            var topPos = { i: i - 1, j: j };
                            var bottomPos = { i: i + 1, j: j };
                            if (this.testContinuable(posClone, self, leftPos) ||
                                    this.testContinuable(posClone, self, rightPos) ||
                                    this.testContinuable(posClone, self, topPos) ||
                                    this.testContinuable(posClone, self, bottomPos)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                
                //当移除满足消除需求的元素以后， 对游戏数据结构中剩余元素的状态进行修改
                this.fillGameBoard = function () {
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            if (gameBoard[i][j] != null) {
                                gameBoard[i][j].clearNew();
                                gameBoard[i][j].clearMoveCount();
                            }
                        }
                    }

                    var pos = this.getFirstEmptyPos();
                    var colMoveCount = {};
                    while (pos) {
                        if (colMoveCount[pos.j]) {
                            colMoveCount[pos.j]++;
                        } else {
                            colMoveCount[pos.j] = 1;
                        }
                        
                        //填充空位置
                        var index = pos.i;
                        while (index > 0) {
                            var grid = gameBoard[index - 1][pos.j];
                            grid.addMoveCount();
                            gameBoard[index][pos.j] = grid;
                            index--;
                        }
                        gameBoard[0][pos.j] = randomGrid();
                        gameBoard[0][pos.j].setMoveCount(colMoveCount[pos.j] - 1);

                        pos = this.getFirstEmptyPos();
                    }
                }
                
                //获得游戏结构中第一个空的位置
                this.getFirstEmptyPos = function () {
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            if (gameBoard[i][j] == null) {
                                return { i: i, j: j };
                            }
                        }
                    }
                }
                
                
                function getRGrids(pos) {
                    var grids = [];
                    for (var i = 0; i < Row; i++) {
                        grids.push(gameBoard[i][pos.j]);
                    }
                    return grids;
                }

                //根据游戏数组结构中元素的id来获得元素的位置
                function getPos(gridID) {
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            if (gameBoard[i][j].getID() == gridID) {
                                return {
                                    i: i, j: j
                                }
                            }
                        }
                    }
                }

                this.getPos = function (gridID) {
                    return getPos(gridID);
                }
                
                //随机生成介于0-9之间的元素
                function randomGrid() {
                    var r = Math.floor(Math.random() * 10);
                    var g = new Grid();
                    g.setNumber(r);
                    return g;
                }
                
                //交换两个元素的位置
                this.swapGrid = function (gridID1, gridID2) {
                    var pos1 = getPos(gridID1);
                    var pos2 = getPos(gridID2);
                    var grid1 = gameBoard[pos1.i][pos1.j];
                    var grid2 = gameBoard[pos2.i][pos2.j];
                    gameBoard[pos1.i][pos1.j] = grid2;
                    gameBoard[pos2.i][pos2.j] = grid1;
                }
            }

            function log(gameBoard) {
                var html = '';
                for (var i = 0; i < Row; i++) {
                    for (var j = 0; j < Col; j++) {
                        if (gameBoard[i][j] == null) {
                            html += ' <span style="color:red;">x</span> ';
                        } else {
                            html += ' ' + gameBoard[i][j].getNumber() + ' ';
                        }
                    }
                    html += "<br/>";
                }
                document.getElementById('log_html').innerHTML = (html + '<br/><br/>');
            }
            
            //游戏界面
            function GridGameUI() {
                var colorMap = {
                    0: 'red',
                    1: 'orange',
                    2: 'yellow',
                    3: 'green',
                    4: 'blue',
                    5: 'white',
                    6: 'black',
                    7: 'pink',
                    8: 'purple',
                    9: 'brown'
                }

                var game = new GridGameStruct();
                var placeholder;
                var selectedGrid;
                var self = this;

                var isGameOver = false;
                var pause = false;
                //分数
                var score = 0;
                //连击数
                var continuousCount = 0;

                this.onRemove = new Function;

                this.gameOver = function () {
                    isGameOver = true;
                }

                this.pause = function (state) {
                    pause = state;
                }

                this.render = function (p) {
                    placeholder = p;
                    initUI();
                }
                
                //绑定事件
                var bindEvent = function () {
                    var gridUIs = document.getElementById(placeholder).getElementsByTagName('div');
                    for (var i = 0; i < gridUIs.length; i++) {
                        gridUIs[i].onclick = function () {
                            if (isGameOver) {
                                alert('游戏结束');
                                return;
                            }

                            if (pause) {
                                alert('游戏处于暂停中');
                                return;
                            }
                            continuousCount = 0;
                            var gridID = this.id.replace(/^grid_/, '');
                            if (selectedGrid && gridID != selectedGrid) {
                                var gridUI1 = $('#grid_' + selectedGrid);
                                var gridUI2 = $('#grid_' + gridID);
                                var gridUI1Offset = { left: gridUI1.css('left'), top: gridUI1.css('top') };
                                var gridUI2Offset = { left: gridUI2.css('left'), top: gridUI2.css('top') };
                                var pos1 = game.getPos(selectedGrid);
                                var pos2 = game.getPos(gridID);

                                if (Math.abs(pos1.i - pos2.i) == 1 && Math.abs(pos1.j - pos2.j) == 0 ||
                                    Math.abs(pos1.i - pos2.i) == 0 && Math.abs(pos1.j - pos2.j) == 1) {
                                    gridUI1.animate(gridUI2Offset, 300);
                                    gridUI2.animate(gridUI1Offset, 300, function(){
                                        if (game.testContinuable(gameBoard, pos1, pos2)) {
                                            game.swapGrid(selectedGrid, gridID);
                                            nextStep();
                                        } else {
                                            gridUI1.animate(gridUI1Offset, 300);
                                            gridUI2.animate(gridUI2Offset, 300);
                                        }
                                        selectedGrid = null;
                                    });
                                    $('#grid_' + selectedGrid).css('opacity', 1);
                                } else {
                                    $('#grid_' + selectedGrid).css('opacity', 1);
                                    selectedGrid = gridID;
                                    $('#grid_' + selectedGrid).css('opacity', 0.5);
                                }
                            } else {
                                selectedGrid = gridID;
                                $(this).css('opacity', 0.5);
                            }
                        }
                    }
                }



                var animate = function () {
                    var finshCount = 0;
                    var moveableGridCount = 0;
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            var grid = gameBoard[i][j];
                            if (grid.moveable()) {
                                moveableGridCount++;
                                if (grid.isNew()) {
                                    genNewGridHtml(i, j, grid);
                                    grid.addMoveCount();
                                }
                                var gridUI = $('#grid_' + grid.getID());
                                gridUI.animate({ top: '+=' + grid.getMoveCount() * 50 }, 500, function () {
                                    finshCount++;
                                    if (finshCount == moveableGridCount) {
                                        nextStep();
                                    }
                                });
                            }
                        }
                    }
                    if (moveableGridCount == 0) {
                        nextStep();
                    }
                }

                var computeScore = function () {
                    var statistics = game.getStatistics();
                    var currScore = 0;
                    for (var key in statistics) {
                        currScore += parseInt(key) * parseInt(statistics[key]);
                    }

                    if (currScore > 0) {
                        continuousCount++;
                        currScore += (continuousCount - 1) * 10;
                        score += currScore;
                        if (typeof (self.onRemove) == 'function') {
                            self.onRemove(currScore, score);
                        }
                    }
                }

                var nextStep = function () {
                    var grids = game.remove();
                    computeScore();

                    for (var i = 0; i < grids.length; i++) {
                        var grid = $('#grid_' + grids[i].getID());
                        grid
                        .css({ 'z-index': '999', 'border': 'none' })
                        .animate({ 'width': '+=32', 'height': '+=32', left: '-=8', top: '-=8' }, 200);
                    }

                    window.setTimeout(function () {
                        genHTML();
                        var firstPos = game.getFirstEmptyPos();
                        if (firstPos) {
                            game.fillGameBoard();
                            animate();
                        } else {
                            if (!game.continuable()) {
                                initUI();
                            }
                        }
                    }, 300);
                }

                var genHTML = function () {
                    var html = '';
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            var grid = gameBoard[i][j];
                            var left = j * 50;
                            var top = i * 50;
                            if (grid != null) {
                                html += '<div id="grid_' + grid.getID() + '" style="background:' + colorMap[grid.getNumber()] + '; left: ' + left + 'px; top: ' + top + 'px; border:5px ' + colorMap[grid.getNumber()] + ' outset"><!--' + grid.getMoveCount() + (grid.isNew() ? '' : '') + '--> </div>';
                            }
                        }
                    }
                    $('#' + placeholder).html(html);
                    bindEvent();
                }

                var genNewGridHtml = function (i, j, grid) {
                    var left = j * 50;
                    var top = -(grid.getMoveCount() - i + 1) * 50;
                    var html = '<div id="grid_' + grid.getID() + '"></div>';
                    var element = $(html);
                    $('#' + placeholder).append(element);
                    element.css({ left: left, top: top, background: colorMap[grid.getNumber()], border: '5px ' + colorMap[grid.getNumber()] + ' outset' });
                }

                var initUI = function () {
                    game.initBoard();
                    for (var i = 0; i < Row; i++) {
                        for (var j = 0; j < Col; j++) {
                            var grid = gameBoard[i][j];
                            grid.setMoveCount(Row - 1);
                        }
                    }
                    $('#' + placeholder).html('');
                    animate();
                }
            }

            window.onload = function () {
                var SECOND = 500;
                var isStart = false;
                var ui;
                var pause;
                var timer;
                var timecount = 0;
                var isGameOver = false;
                
                //限时500秒
                function timing() {
                    if (isGameOver) {
                        window.clearInterval(timer);
                        return;
                    }
                    timecount++;
                    $('#time').html(timecount + '秒');
                    if (timecount >= SECOND) {
                        isGameOver = true;
                        ui.gameOver(isGameOver);
                    }
                }

                $('#start_btn').bind('click', function () {
                    if (!isStart) {
                        ui = new GridGameUI();
                        ui.onRemove = function (currScore, score) {
                            $('#score').html(score);
                        }
                        ui.render('g_board');
                        isStart = true;
                        $(this).val('暂停游戏');

                        timer = window.setInterval(timing, 1000);
                    } else {
                        if (isGameOver) {
                            alert('游戏已结束，请点击重新开始按扭');
                            return;
                        }
                        if (pause) {
                            pause = false;
                            $(this).val('暂停游戏');
                            timer = window.setInterval(timing, 1000);
                        } else {
                            pause = true;
                            $(this).val('取消暂停');
                            window.clearInterval(timer);
                        }
                        ui.pause(pause);
                    }

                });

                $('#restart_btn').bind('click', function () {
                    window.location.reload();
                })
            }

        })();
