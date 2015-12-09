var Player = function (htmlContainer, param, w, h) {
    this.htmlContainer = htmlContainer;
    this.startTime = (param.startTime) ? param.startTime : new Date();
    this.endTime = (param.endTime) ? param.endTime : new Date();
    this.fps = (param.fps) ? param.fps : "1";
    this.resolutionWidth = (param.resolutionWidth) ? param.resolutionWidth : 320;
    this.resolutionHeight = (param.resolutionHeight) ? param.resolutionHeight : 240;
    this.playTime = new Date(this.startTime.getTime());
    this.isPlay = false;
    this.playInterval;
    this.htmlCanvasVideo;  //(影像)
    this.htmlCanvasSubtitle; //(字幕)
    this.ctxVideo; //(影像)
    this.ctxSubTitle; //(字幕)
    this.repeat = false;
    this.requestSpeed = 1000 / this.fps;
    var that = this;
    var ws;

    function init() {
        // create canvas 1 (影像)
        that.htmlCanvasVideo = document.createElement("canvas");
        that.htmlCanvasVideo.style.position = "absolute";
        that.htmlCanvasVideo.style.zIndex = 100;
        that.htmlCanvasVideo.style.backgroundColor = "black";
        that.htmlCanvasVideo.width = w;
        that.htmlCanvasVideo.height = h;
        that.ctxVideo = that.htmlCanvasVideo.getContext("2d");

        that.htmlContainer.appendChild(that.htmlCanvasVideo);

        // create canvas 2 (字幕)
        that.htmlCanvasSubtitle = document.createElement("canvas");
        that.htmlCanvasSubtitle.style.position = "absolute";
        that.htmlCanvasSubtitle.style.zIndex = 101;
        that.htmlCanvasSubtitle.width = w;
        that.htmlCanvasSubtitle.height = h;
        that.ctxSubTitle = that.htmlCanvasSubtitle.getContext("2d");
        that.ctxSubTitle.font = "20px arial";
        that.ctxSubTitle.fillStyle = "white";

        that.htmlContainer.appendChild(that.htmlCanvasSubtitle);
    }

    this.open = function () {
        ws = new WebSocket("ws://10.144.183.151:9999");
        //playFrame();
    };

    this.close = function () {
        clearInterval(that.playInterval);
        that.isPlay = false;
        that.playTime = new Date(that.startTime.getTime());
        that.ctxVideo.clearRect(0, 0, that.htmlCanvasVideo.width, that.htmlCanvasVideo.height);
    };

    this.nextFrame = function () {
        //console.log("next" + that.playTime.getTime());
        that.playTime.setMilliseconds(that.playTime.getMilliseconds() + (1000 / parseInt(that.fps)));

        playFrame();

        // test ---------------
        if (that.playTime.getTime() == 1419465605000) {
            that.requestSpeed = that.requestSpeed / 4;
            clearInterval(that.playInterval);
            that.playInterval = setInterval(function () { that.nextFrame() }, that.requestSpeed);
        }
        if (that.playTime.getTime() == 1419465635000) {
            that.requestSpeed = 1000 / that.fps;
            clearInterval(that.playInterval);
            that.playInterval = setInterval(function () { that.nextFrame() }, that.requestSpeed);
        }

        // -------------------
    };

    this.previousFrame = function () {
        //console.log("previous" + that.playTime.getTime());
        that.playTime.setMilliseconds(that.playTime.getMilliseconds() - (1000 / parseInt(that.fps)));

        playFrame();
    };

    this.pause = function () {
        if (that.isPlay) {
            clearInterval(that.playInterval);
            that.isPlay = false;
        }
    };

    this.stop = function () {
        clearInterval(that.playInterval);
        that.isPlay = false;
        that.playTime = new Date(that.startTime.getTime());
        that.ctxVideo.clearRect(0, 0, that.htmlCanvasVideo.width, that.htmlCanvasVideo.height);
        that.ctxSubTitle.clearRect(0, 0, that.htmlCanvasVideo.width, that.htmlCanvasVideo.height);

        playFrame();
    };

    this.play = function () {
        if (!that.isPlay) {
            that.isPlay = true;
            //that.playInterval = setInterval(function () { that.nextFrame() }, that.requestSpeed);

            var now = new Date(), start, end;
            now.setMilliseconds(0);
            oldStart = new Date(now.getTime());
            oldStart.setMilliseconds(0);
            oldStart.setSeconds(0);
            oldStart.setMinutes(0);
            oldStart.setMinutes(-6);
            start = new Date(oldStart.getTime());
            end = new Date(now.getTime());
            end.setMilliseconds(0);
            end.setSeconds(0);
            end.setMinutes(66);

            var msg = {
                "command": "play",
                "scale": 1,
                "start": start.getTime(),
                "end": end.getTime()
            };

            ws.onmessage = function (data, flags) {
                // flags.binary will be set if a binary data is received.
                // flags.masked will be set if the data was masked.
                var msg = JSON.parse(data.data);
                //console.log(msg.timestamp, msg.data);
                if (msg.command == "img")
                    playFrame(msg.data, msg.timestamp);
                else if (msg.command == "rest")
                    playFrame("", msg.timestamp);

                setCuepoint(msg.timestamp);
                //console.log(msg.timestamp);
            };

            ws.onclose = function close() {
                console.log('disconnected');
            };

            ws.send(JSON.stringify(msg), function ack(error) {
            });

        }
    };

    this.smartPlay = function () {

    };

    this.changeSize = function (w, h) {
        that.htmlCanvasVideo.width = w;
        that.htmlCanvasVideo.height = h;
        that.htmlCanvasSubtitle.width = w;
        that.htmlCanvasSubtitle.height = h;
        that.ctxSubTitle.font = "20px arial";
        that.ctxSubTitle.fillStyle = "white";

    };
    function playFrame(imgData, timestamp) {
        var d = new Date(timestamp);

        if (imgData != "") {
            var myImage = new Image();
            console.log("play " + d.toLocaleString());
            //myImage.time = that.playTime.getTime();
            myImage.time = timestamp;
            //myImage.src = "source/fps" + that.fps + "r" + that.resolutionWidth.toString() + that.resolutionHeight.toString() + "/" + that.playTime.getTime().toString() + ".png";
            //var d = new Date(that.playTime.getTime);
            //console.log(imgData);
            myImage.src = "data:image/jpg;base64," + imgData;
            //drawImg(myImage);


            myImage.onload = function () {
                //console.log("abc");
                drawImg(myImage);
                //var d = new Date(this.time);
                //drawText(d.toLocaleString() + "(" + d.getTime() + ")");
            };


            // repeat
            //if (that.playTime.getTime() == that.endTime.getTime()) {
            //    if (that.repeat)
            //        that.playTime = new Date(that.startTime.getTime());
            //    else {
            //        that.pause();
            //    }
            //}
        }

        drawText(d.toLocaleString() + "(" + d.getTime() + ")");

    }

    function drawImg(img) {
        that.ctxVideo.drawImage(img, 0, 0, that.htmlCanvasVideo.width, that.htmlCanvasVideo.height);
    }

    function drawText(time) {
        that.ctxSubTitle.clearRect(0, 0, that.htmlCanvasSubtitle.width, that.htmlCanvasSubtitle.height);
        that.ctxSubTitle.fillText(time, 0, that.htmlCanvasSubtitle.height);
    }

    init();
};