//utf8
//布匹分段及裁剪概览
//外抛数据接口
//len 当前的布长 80米，100米等等
//perLen 刻度的最小长度，默认为10米
//direction 当前的绘制方向，默认为right，可以设置为left，用于标记0点在右侧还是在左侧
//flaws 疵点的数组列，推荐结构为 {start:起始位置,end:结束位置,width:宽度，如果为点则为0; type疵点类型，dot或者非dot}
//cuts 裁剪的布段数组列，推荐结构为
//pos  当前记米器的位置坐标
Vue.component('rex-cloth', {
    template: ''+
        '<div class="clothShow">'+
            '<div class="cloth" ref="cloth">' +
                '<span class="nowBlock"></span>' +
                '<span class="clip" :style="getPositionStyle()"></span>' +
                '<span class="flaw" v-for="(item,index) in flaws" :index="index+1" :style="getFlawStyle(item)"></span>' +
            '</div>' +
            '<div class="ruler" ref="ruler">' +
                '<span v-for="item in getMark" :pos="item" :style="getRulerStyle(item)"></span>' +
            '</div>' +
        '</div>',
    props:{
        len:{
            required:  true
        },
        perLen:{
            default: 10
        },
        direction:{
            required: true
        },
        flaws:{
            required: true
        },
        cuts:{
            default: []
        },
        pos:{
            required: true
        }
    },
    computed:{
        getMark: function(){
            var loopCount=Math.ceil(this.len/this.perLen);
            var result=[];
            for (var i=0; i<loopCount; i++){
                result.push(i*this.perLen);
            }
            result.push(this.len);
            return result;
        }
    },
    methods:{
        drawRulers: function(){
            var tempArray=$(this.$refs.ruler).children('span');
            var reverse=this.direction=='left'? 'right':'left';
            var i,pos1,pos2;
            for (i=0; i<tempArray.length-1; i++){
                pos1=$(tempArray[i]).attr('pos');
                pos2=pos1/this.len * 100 + '%';
                $(tempArray[i]).css(this.direction, pos2).css(reverse, 'auto');
            }
            i=tempArray.length-1;
            pos1=$(tempArray[i]).attr('pos');
            pos2=pos1/this.len * 100 + '%';
            $(tempArray[i]).css(this.direction, 'calc('+ pos2 + ' - 1px)').css(reverse, 'auto');
        },
        getRulerStyle: function(item){
            var result={};
            if (item===this.len){
                result[this.direction]='calc(100% - 1px)';
            }else{
                result[this.direction]=item/this.len*100+'%';
            }
            return result;
        },
        getFlawStyle: function(item){
            var pos,width;
            pos=item.end/this.len*100+'%';
            if (item.type==='dot'){
                width='1px';
            }else{
                width=item.width/this.len*100+'%';
            }
            var result={};
            result[this.direction]=pos;
            result.width=width;
            return result;
        },
        getPositionStyle: function(){
            var result={};
            if (this.pos==='' || this.pos-0>this.len-0){
                result['display']='none';
            }else{
                result[this.direction]=this.pos/this.len*100+'%';
            }
            return result;
        },
        getCusStyle: function(){

        }
    }
});