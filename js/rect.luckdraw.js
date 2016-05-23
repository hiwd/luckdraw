/*!
 * 方形抽奖
 * @author wd<githiwd@163.com>
 * @GitHub https://github.com/hiwd/luckdraw
 */
$(function(){
    /**
     * @param {String} selector 奖品容器选择器
     * @param {Object} prizeObj 奖品列表
     * @param {Object} options 扩展
     */
    function RectLuckDraw(selector, prizeObj, options){
        this.$selector = null;
        this.prizeObj = prizeObj;
        this.seqLis = [];

        //是否锁定
        this.locked = false;

        this.options = $.extend(true, {
            itemClass: 'js-item', //奖品
            startBtnClass: 'js-start-btn', //开始按钮
            selectedClass: 'selected', //奖品选中添加类
            itemSortAttr: 'data-sort', //奖品排序 1开始
            prizeIdAttr: 'data-prize-id', //奖品ID
            defaultAnimateDelay: 200, //默认延迟
            turnAroundCount: 3,
            minAnimateDelay: 50,
            maxAnimateDelay: 1000,
            calcAniDelay: false, // 当为function且有返回值时 function(当前延迟， 当前圈数， 当前项序号){return 新的延迟时间}
            turnStartCallback: function(){},
            turnEndCallback: function(prizeId, prizeObj){},
            startBtnClick: function($btn){},
            onLock: function(){},
            onUnlock: function(){}
        }, options);

        this._init(selector);
    }

    /**
     * 开始抽奖动画
     * @param  {String} prizeId 奖品ID
     */
    RectLuckDraw.prototype.start = function(prizeId){
        var _this = this, 
            options, $li;
        if(this.isLocked() || this.seqLis.length == 0){
            return;
        }

        this.lock();

        this._initParams();

        options = this.options;

        //要不要改为记录最后数据取消
        for(var i=0, len=this.seqLis.length; i<len; i++){
            $li = this.seqLis[i];
            if($li.hasClass(options.selectedClass)){
                $li.removeClass(options.selectedClass);
                break;
            }
        }

        this.seqLis[0].addClass(options.selectedClass);
        //函数是否写到里面
        setTimeout(function(){
            _this._turning(prizeId);
        }, this.aniDelay);

        if(typeof options.turnStartCallback == 'function'){
            options.turnStartCallback.apply(this, []);
        }
    };

    /**
     * 初始化
     */
    RectLuckDraw.prototype._init = function(selector){
        var $selector = $(selector), 
            options = this.options, 
            $lis = $selector.find('.' + options.itemClass);

        this.$selector = $selector;
        this.$lis = $lis;

        this._sortLis($lis);

        this._initParams();

        this._bindEvents();
    };

    RectLuckDraw.prototype._initParams = function(){
        this.aniIndex = 0; //当前动画播放位置
        this.aniDelay = this.options.defaultAnimateDelay; //当前动画的延迟
        this.currCircle = 0; //当前第几圈
    };

    RectLuckDraw.prototype._bindEvents = function(){
        var _this = this;

        this.$selector.on('click', '.' + this.options.startBtnClass, function(){
            var $this = $(this);

            if(typeof _this.options.startBtnClick == 'function'){
                _this.options.startBtnClick.apply(_this, [$this]);
            }
        });
    };

    /**
     * 奖品项排序
     * @param  {jQueryObject} $lis 奖品项
     */
    RectLuckDraw.prototype._sortLis = function($lis){
        var _this = this, 
            options = this.options;
        $lis.each(function(i){
            _this.seqLis.push($lis.filter('[' + options.itemSortAttr + '="' + (i + 1) + '"]'));
        });
    };

    /**
     * 抽奖过程
     * @param  {String} prizeId 奖品ID
     */
    RectLuckDraw.prototype._turning = function(prizeId){
        var _this = this, 
            options = this.options, 
            selectedClass = options.selectedClass, 
            seqLis = this.seqLis, 
            seqLen = seqLis.length;

        seqLis[this.aniIndex].removeClass(selectedClass);
        this.aniIndex++;
        if(this.aniIndex >= seqLen){
            this.aniIndex = 0;
            this.currCircle++;
        }
        seqLis[this.aniIndex].addClass(selectedClass);

        this._calcAniDelay();

        if(this.currCircle == options.turnAroundCount && seqLis[this.aniIndex].attr(options.prizeIdAttr) == prizeId){
            this._turnEnd(prizeId);
        }else{
            setTimeout(function(){
                _this._turning(prizeId);
            }, this.aniDelay); 
        }
    };

    /**
     * 抽奖结束
     * @param  {String} prizeId 奖品ID
     */
    RectLuckDraw.prototype._turnEnd = function(prizeId){
        this._initParams();

        this.unlock();
        
        if(typeof this.options.turnEndCallback == 'function'){
            this.options.turnEndCallback.apply(this, [prizeId, this.prizeObj[prizeId]]);
        }
    };

    /**
     * 计算动画延迟, 计算方法使用calcAniDelay自己定制
     */
    RectLuckDraw.prototype._calcAniDelay = function(){
        var options = this.options, 
            delay;
        if(typeof options.calcAniDelay == 'function'){
            delay = options.calcAniDelay.apply(this, [this.aniDelay, this.currCircle, this.aniIndex]);
        }
        if(delay){
            this.aniDelay = delay;
            return;
        }

        if(this.currCircle < Math.max(Math.floor(options.turnAroundCount * 4 / 5), options.turnAroundCount - 2)){
            this.aniDelay = Math.max(this.aniDelay - 5, options.minAnimateDelay);
        }else{
            this.aniDelay = Math.min(this.aniDelay + this.aniIndex * 5 * 3, options.maxAnimateDelay);
        }
    };

    /**
     * 锁定, 设置后不能抽奖
     */
    RectLuckDraw.prototype.lock = function(){
        this.locked = true;

        if(typeof this.options.onLock == 'function'){
            this.options.onLock.apply(this, []);
        }
    };

    /**
     * 解锁
     */
    RectLuckDraw.prototype.unlock = function(){
        this.locked = false;

        if(typeof this.options.onLock == 'function'){
            this.options.onUnlock.apply(this, []);
        }
    };

    /**
     * 获取锁定状态
     * @return {Boolean} flag
     */
    RectLuckDraw.prototype.isLocked = function(){
        return this.locked;
    };

    window.RectLuckDraw = RectLuckDraw;
});