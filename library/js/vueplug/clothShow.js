//utf8
//布匹分段及裁剪概览
//外抛数据接口
//len 当前的布长 80米，100米等等
//*perLen 刻度的最小长度，默认为10米
//*direction 当前的绘制方向，默认为right，可以设置为left，用于标记0点在右侧还是在左侧
//flaws 疵点的数组列，推荐结构为 {start:起始位置,end:结束位置,width:宽度，如果为点则为0; type疵点类型，dot或者非dot}
//*cuts 裁剪的布段数组列，推荐结构为
//pos  当前记米器的位置坐标
//*select 当前任务长度
//first  标记当前第一个布段
//qualified 合格对象 {class,name}
//原先button 项的disabled判定还有个条件 || select===''"
Vue.component('rex-cloth', {
    template: ''+
        '<div class="clothShow" :class="{\'zero\':len===0}">'+
            '<div class="cloth" ref="cloth">' +
                '<span class="cutBlock sel first" :style="getCutStyle()"><span class="exceed" v-if="exceed"></span></span>' +
                '<span class="clip" :style="getPositionStyle()"></span>' +
                '<span class="flaw" v-for="(item,index) in flaws" :index="index+1" :style="getFlawStyle(item)"></span>' +
                '<span class="endShow A" :style="getFromStyle(0)">A</span><span class="endShow B" :style="getFromStyle(1)">B</span>' +
                '<span class="qualified" v-if="qualified.class && len>0" :class="qualified.class">{{qualified.name}}</span>' +
            '</div>' +
            '<div class="ruler" ref="ruler">' +
                '<span v-for="item in getMark" :pos="item" :style="getRulerStyle(item)"></span>' +
            '</div>' +
            '<button class="rexButton changePosition" color="info" @click="eventChangePosition" :disabled="!canreverse || len===0"><span class="fa fa-retweet"></span></button>' +
        '</div>',
    props:{
        len:{
            required: true
        },
        perLen:{
            default: 10
        },
        direction:{
            default: 'right'
        },
        flaws:{
            required: true
        },
        cuts:{
            default: []
        },
        pos:{
            required: true
        },
        select:{
            default: ''
        },
        fromwhere:{
            required: true
        },
        canreverse:{
            default: true
        },
        qualified:{
            default:{class:'',name:''}
        },
        exceed:{
            default: false
        }
    },
    computed:{
        getMark: function(){
            var loopCount=Math.ceil(this.len/this.perLen);
            var result=[];
            for (var i=0; i<loopCount; i++){
                result.push(i*this.perLen);
            }
            if (this.len-result[result.length-1]>this.perLen/2 || result.length===1){
                result.push(this.len);
            }else{
                result[result.length-1]=this.len;
            }
            return result;
        }
    },
    methods:{
        getRulerStyle: function(item){  //计算刻度线坐标
            var result={};
            if (item===this.len){
                result[this.direction]='calc(100% - 1px)';
            }else{
                result[this.direction]=item/this.len*100+'%';
            }
            return result;
        },
        getFlawStyle: function(item){  //计算疵点坐标和宽度
            var pos,width;
            if (item.defect_type==='dot'){
                pos=item.end/this.len*100+'%';
                width='1px';
            }else{
                pos=item.start/this.len*100+'%';
                width=item.length/this.len*100+'%';
            }
            var result={};
            result[this.direction]=pos;
            result.width=width;
            return result;
        },
        getPositionStyle: function(){  //计算当前计米器的坐标
            var result={};
            if (this.pos===''){
                result['display']='none';
            }else{
                result[this.direction]=this.pos/this.len*100+'%';
            }
            return result;
        },
        getCutStyle: function(){
            var result={};
            var checker=/\d+/;
            var dis=this.select.replace('米','');
            if (checker.test(dis)){
                result[this.direction]='0';
                result['width']=dis/this.len*100+'%';
                if (dis/this.len>1){
                    this.exceed=true;
                }else{
                    this.exceed=false;
                }
            }else{
                result['display']='none';
                this.exceed=false;
            }
            return result;
        },
        checkSelect: function(item){   //用于标记是否选择，标记是否可截取
            var result={
                sel: false,
                first: false
            };
            if (this.select){
                if (item.bolt_id===this.select.bolt_id){
                    result.sel=true;
                    if (item.bolt_id===this.cuts[0].bolt_id) result.first=true;
                }
            }
            return result;
        },
        getFromStyle: function(id){
            var nowValue=this.fromwhere==='start_a'? 0:1;
            var pos=this.direction;
            var posRev=pos==='left'? 'right':'left';
            var result={};
            if (nowValue^id===1){
                result[posRev]='-4px';
            }else{
                result[pos]='-4px';
            }
            return result;
        },
        //切换方向的调用函数
        eventChangePosition: function(){  //如果父组件绑定事件，点击图标调用该事件
            this.$emit('changeposition');
        }
    }
});