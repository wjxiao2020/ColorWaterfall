var game = new Vue({
    el: "#main_container",
    data: {
        boardSize: 16,
        colorNum: 5,
        colors: ["rgb(238, 63, 77)",
            "rgb(250, 126, 35)",
            "rgb(251, 200, 47)",
            "rgb(65, 174, 60)",
            "rgb(92, 183, 208)",
            "rgb(41, 118, 183)",
            "rgb(128, 109, 158)",
            "rgb(154, 136, 120)"],
        colorIdMap: [],
        stateMap: [],
        // indicates if each block is already on delayed calling of waterfall method, true/false
        waterfallMap:[],
        stepUsed: 0,
        // initialized for the default 16x16 board, 5 colors
        stepAllowed: 31,
        finish: false,
        fail: false
    },
    computed: {
        totalBlockNum() {
            return this.boardSize * this.boardSize;
        }
    },
    methods: {
        // randomly generate the color for each block on the game board
        generateColorIdMap: function() {
            while (this.colorIdMap.length < this.totalBlockNum) {
                let id = Math.floor(Math.random() * this.colorNum);
                this.colorIdMap.push(id);
            }
        },

        // initializes the state map
        // 1 represents this block is already a part of the waterfall
        // 0 represents this block is not yet included in the waterfall
        initializeStateMap: function() {
            // the block on the top left is the starting point of the waterfall
            this.stateMap.push(1);
            while(this.stateMap.length < this.totalBlockNum) {
                this.stateMap.push(0);
            }
        },

        // initialize all block to be false
        initializeWaterfallMap: function() {
            while(this.waterfallMap.length < this.totalBlockNum) {
                let waterfallState = {};

                for (let i = 0; i < this.colorNum; i++) {
                    waterfallState["color" + i] = false;
                }

                this.waterfallMap.push(waterfallState);
            }
        },

        // get the color of the block specified by the given row and column
        getColor: function(row, column) {
            if (this.colorIdMap.length == 0) {
                this.generateColorIdMap();
            }
            let colorId = this.getColorId(row, column);
            return this.colors[colorId];
        },

        // get the color id of the block specified by the given row and column
        getColorId: function(row, column) {
            let block = (row - 1) * this.boardSize + column;
            return this.colorIdMap[block - 1];
        },

        // reset the game
        reset: function() {
            this.colorIdMap = [];
            this.generateColorIdMap();
            // for (let i = 0; i < this.colorIdMap.length; i++) {
            //     let row = Math.floor(i / this.boardSize) + 1;
            //     let column = i % this.boardSize + 1;
            //     this.$refs['block' + row + '_' + column][0].style.backgroundColor = this.getColor(row, column);
            // }

            this.stateMap=[];
            this.waterfallMap = [];
            this.stepUsed = 0;
            this.stepAllowed = (parseInt(this.boardSize) - 3) * 2 + parseInt(this.colorNum) * 2 - 5;
            this.finish = false;
            this.fail = false;
        },

        // handles a clicking event on the color blocks
        blockClick: function(row,column) {
            // check if the state map haven't been initialized yet
            if (this.stateMap.length == 0) {
                this.initializeStateMap();
            }

            let currentColor = this.getColorId(row, column);
            let previousColor = this.getColorId(1, 1);
            if (currentColor != previousColor) {
                this.stepUsed++;
                if (this.stepUsed > this.stepAllowed) {
                    this.fail = true;
                }

                this.waterfallMap = [];
                this.initializeWaterfallMap();
                this.waterfall(previousColor, currentColor, 0)
                this.waterfallMap[0]["color" + currentColor] = true;
            }
        },

        // creates the waterfall effect
        waterfall: function(fromColor, toColor, blockIndex) {
            // determines if the current block is already included in the waterfall,
            // if so, turn it into the new waterfall color, and check its neighbors,
            // if they are mark as not included, then check their color to see if they should be included
            if (this.stateMap[blockIndex] == 1) {
                this.colorIdMap[blockIndex] = toColor;

                let topIndex = blockIndex - parseInt(this.boardSize);
                // if this block has a block on top of it
                if (topIndex >= 0) {
                    // only continuing checking and updating the block if it is already included in the waterfall
                    // but haven't updated to the current waterfall color,
                    // or it has the same color as the last waterfall color so that it should now be included in the waterfall
                    this.checkBlock(topIndex, fromColor, toColor, blockIndex);
                }

                let bottomIndex = blockIndex + parseInt(this.boardSize);
                // if this block has a block below of it
                if (bottomIndex < this.totalBlockNum) {
                    this.checkBlock(bottomIndex, fromColor, toColor, blockIndex);
                }

                let leftIndex = blockIndex - 1;
                // if this block has a block on the left of it
                if (blockIndex % this.boardSize != 0) {
                    this.checkBlock(leftIndex, fromColor, toColor, blockIndex);
                }

                let rightIndex = blockIndex + 1;
                // if this block has a block on the right of it
                if (rightIndex % this.boardSize != 0) {
                    this.checkBlock(rightIndex, fromColor, toColor, blockIndex);
                }

                let row = Math.floor(blockIndex / this.boardSize) + 1;
                let column = blockIndex % this.boardSize + 1;
                this.$refs['block' + row + '_' + column][0].style.backgroundColor = this.getColor(row, column);
                this.finish = this.checkFinish();
            }
        },

        // checks the block of the given index if it is not included in the waterfall
        // but also have the same color as the given waterfall color,
        // if so, update its state in the state map and returns true
        checkBlock: function(index, fromColor, toColor, callFrom) {

            if (!this.waterfallMap[index]["color"+toColor] && ((this.stateMap[index] == 1 && !(this.colorIdMap[index] == toColor)) || (this.stateMap[index] == 0 && this.colorIdMap[index] == fromColor))) {
                this.stateMap[index] = 1;
                this.waterfallMap[index]["color"+toColor] = true;

                setTimeout(()=>this.waterfall(fromColor, toColor, index), 15);
            }
        },

        // checks if the game is finish (all block are in the same color) and returns the result as true/false
        checkFinish: function() {
            let mainColor = this.$refs['block1_1'][0].style.backgroundColor;
            for (let i = 1; i < this.totalBlockNum; i++) {
                let row = Math.floor(i / this.boardSize) + 1;
                let column = i % this.boardSize + 1;
                let blockColor = this.$refs['block' + row + '_' + column][0].style.backgroundColor;
                // this function accidentally solved the problem of the colorIdMao not updating in time in the last scene
                // causing the next round of game to show the wrong color, probably because this function have checked
                // every block in the game board triggered them to update their colorId

                if (mainColor.localeCompare(blockColor) != 0) {
                    return false;
                }
            }
            return true;
        }
    }
});