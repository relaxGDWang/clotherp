var PCOUNT=0;
var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: undefined, //默认进行中任务，finished完成的任务
            urgent: ''            //是否加急，加急1，否则留空
        },
        username: '',
        equipment:{
            printer:'',
            counter:'',
            neter:''
        },
        flagReload: false,     //用于标记详情窗口关闭是否要刷新列表
        currentPosition: '',
        positionTime:'',  //计米器读数时间函数
        positionPer: 1000, //读取频率
        positionCallBack: '',  //长度变更时的回调函数
        UI:{
            listHeight: 100,
            bottomListHeight: 100,
            len: 0
        },
        input:{
            flag: false,  //标记修改操作的ajax是否在提交
            msg:'',        //错误信息提示
            status: '',    //错误信息状态
            len: '',       //修正布长
            start:'',      //疵点开始
            end:'',        //疵点结束
            step:2,        //步骤
            readonly: true   //是否自定义输入，否则按计米器数值输入
        },
        editObject: {},
        mission: [],    //任务细分数组，ajax直接返回
        missionKey: {}  //bolt_id与数组index对应关系
    },
    computed:{
        isDisabled: function(){
            return this.search.listType || this.editObject.finished;
        }
    },
    methods:{
        startEQPosition: function(){  //开始计米器读数
            this.positionTime=setInterval(EQUIPMENT.getCounter,vu.positionPer);
        },
        stopEQPosition: function(){  //关闭计米器读数
            clearInterval(vu.positionTime);
            this.positionTime='';
        },
        changeSearch: function(val){
            this.search.listType=val;
        },
        getList: function(){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.flagReload=false;
            ajax.send({
                url: PATH.missionCheck,
                data:{status: this.search.listType, urgent: (this.search.urgent || undefined)},
                success:function(data){
                    dialog.close('loading');
                    for (var i = 0; i < data.length; i++) {
                        data[i].position=data[i].position.split(REG.position);  //加工所在仓位
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']] = vu.mission[i];
                    }
                }
            });
        },
        //bid 每个裁剪分段的编号 bno 每个布匹的编号
        openDetails: function(bid, start){
            var dialogConfig={
                closeCallback: function(){
                    vu.editObject={};
                    if (vu.flagReload) vu.getList();
                    vu.UI.len='';
                    vu.stopEQPosition();
                }
            };
            if (this.missionKey[bid].viewObj!==undefined && start===undefined){
                this.editObject=this.missionKey[bid];
                this._setColthLen();
                this.startEQPosition();
                dialog.open('opDetails',dialogConfig);
            }else{
                ajax.send({
                    url: PATH.missionCheckDetails,
                    data:{bolt_id: bid, start: (start || undefined)},
                    success:function(data){
                        dialog.close('loading');
                        vu._setDetailsData(data,data.bolt_id);
                        vu.startEQPosition();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }
        },
        _setDetailsData: function(data, idStr){
            var flag=false;
            if (!idStr){
                idStr=this.editObject.bolt_id;
                flag=true;
            }
            data.defects=this._formatFlawInfor(data.defects);
            Vue.set(this.missionKey[idStr],'viewObj',data);
            Vue.set(this.missionKey[idStr],'finished',false);  //标记当前布匹是否完成检验
            if (!flag) Vue.set(this,'editObject',this.missionKey[idStr]);
            this._setColthLen();
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.viewObj.current_length;
            }else{
                this.UI.len='';
            }
        },
        askFinish: function(){
            //检测当前计米和需裁剪的是否匹配
            var p=0.5,msg,className;
            var checkValueMax=this.editObject.cut_length + p;
            var checkValueMin=this.editObject.cut_length - p;
            if (this.currentPosition && this.currentPosition>=checkValueMin && this.currentPosition<=checkValueMax){
                msg='是否完成当前布匹的检验任务？';
                className='sure';
            }else{
                msg='计米长度与布匹长度不匹配，是否任然完成当前检验任务？';
                className='warning';
            }
            dialog.open('information',{
                content: msg,
                cname: className,
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish();
                }
            });
        },
        doFinish: function(){
            ajax.send({
                url: PATH.missionCheckFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id},
                success:function(data){
                    vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    dialog.close('loading');
                    dialog.open('information', {content: '布匹检验已完成！',btncancel: '',cname:'ok'});
                    //把当前对象标记为已完成
                    vu.editObject.finished=true;
                }
            });
        },
        _resetInputData: function(){  //重置输入数据
            this.positionCallBack='';
            this.input.flag=false;
            this.input.msg='';
            this.input.status='';
            this.input.len='';
            this.input.start='';
            this.input.end='';
            this.input.step=2;
            this.input.readonly=true;
        },
        resetLength: function(){  //重写布匹长度操作
            dialog.open('reLength',{closeCallback: vu._resetInputData});
            this.input.len=this.currentPosition===''? this.UI.len : this.currentPosition;
            this.positionCallBack=function(newVal){
                this.input.len=newVal;
            };
        },
        doResetLength: function(){ //重写布匹长度ajax
            if (REG.flaw.test(this.input.len)===false || this.input.len==0){
                this._setMessage({status:'warning',msg:'布长填写错误，请重新输入'});
                return;
            }
            if (this.input.len==this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'填写值和当前长度一致，无需提交'});
                return;
            }
            ajaxModify.send({
                url: PATH.resetLength,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, length: vu.input.len},
                success: function(data){
                    //调整布长
                    vu._setDetailsData(data);
                    vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len});
                    vu.positionCallBack='';
                    setTimeout(function(){
                        dialog.close('reLength');
                        vu._resetInputData();
                    },1500);
                }
            });
        },
        operateFlaw: function(bolt_id){
            if (bolt_id===undefined){ //添加疵点操作
                dialog.open('addFlaw',{closeCallback: vu._resetInputData});
                this.input.end=this.currentPosition===''? 0: this.currentPosition;  //notice
                this.positionCallBack=function(newVal){
                    //this.input.start=newVal;
                    this.input.end=newVal;
                };
            }else{   //删除疵点操作
                dialog.open('information',{
                    content:'是否确定删除当前疵点？',
                    cname:'sure',
                    closeCallback: function(id, dialogType, buttonType){
                        if (buttonType==='sure'){
                            vu.delOperateFlaw(bolt_id);
                        }
                    }
                });
            }
        },
        goStep: function(op){   //分步骤展现操作
            switch(op){
                case 'next':
                    if (REG.flaw.test(this.input.start)===false){
                        this._setMessage({status:'warning',msg:'疵点开始位置填写有误'});
                        return;
                    }
                    if (this.input.start>this.editObject.viewObj.current_length){
                        this._setMessage({status:'warning',msg:'疵点开始位置大于布长，请重新输入'});
                        return;
                    }
                    this.input.step=2;
                    this.input.end=this.input.start;
                    this.positionCallBack=function(newVal){
                        this.input.end=newVal;
                    };
                    break;
                case 'prev':
                    this.input.step=1;
                    this.positionCallBack=function(newVal){
                        this.input.start=newVal;
                    };
                    break;
            }
        },
        addOperateFlaw: function(){ //添加疵点ajax
            if (REG.flaw.test(this.input.end)===false){
                this._setMessage({status:'warning',msg:'疵点结束位置填写有误'});
                return;
            }
            if (this.input.end>this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'疵点结束位置大于布长，请重新输入'});
                return;
            }
            if (this.input.end<this.input.start){
                this._setMessage({status:'warning',msg:'疵点结束位置不能小于开始位置，请重新输入'});
                return;
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, defects:[vu.input.end+","+vu.input.end]},  //notice
                success: function(data){
                    vu._setDetailsData(data);
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功！'});
                    vu.positionCallBack='';
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu._resetInputData();
                    },2000);
                }
            });
        },
        delOperateFlaw: function(bolt_id){   //删除疵点ajax
            ajax.send({
                url: PATH.delFlaw,
                method: 'delete',
                data:{bolt_id: bolt_id},
                success: function(data){
                    dialog.close('loading');
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',cname:'ok'});
                    vu._setDetailsData(data);
                }
            });
        },
        _setMessage: function(config){
            this.input.flag=config.flag || false;
            this.input.status=config.status || '';
            this.input.msg=config.msg || '';
        },
        operateBefore: function(){  //用于设置操作的ajax before的设置
            this._setMessage({flag:true,status:'loading',msg:'正在提交设置数据，请稍等...'});
        },
        operateError: function(code, msg){
            this._setMessage({status:'error', msg:msg});
        },
        _formatFlawInfor: function(itemList){   //批处理瑕疵点
            for (var i=0; i<itemList.length; i++){
                if (itemList[i].defect_type==='dot'){
                    itemList[i].position=itemList[i].end;
                    itemList[i].length='';
                }else{
                    itemList[i].position=itemList[i].start+'~'+itemList[i].end;
                }
            }
            return itemList;
        },
        //打印标签
        printDoing: function(typeStr){
            if (!typeStr){
                dialog.open('printBox');
            }else{
                var printStr='';
                if (typeStr==='start'){
                    if (this.editObject.viewObj.start==='start_a'){
                        printStr=this.editObject.viewObj.print_head;
                    }else{
                        printStr=this.editObject.viewObj.print_tail;
                    }
                }else{
                    if (this.editObject.viewObj.start==='start_a'){
                        printStr=this.editObject.viewObj.print_tail;
                    }else{
                        printStr=this.editObject.viewObj.print_head;
                    }
                }
                printStr=JSON.stringify(printStr);
                //console.log(printStr);
                EQUIPMENT.print(printStr);
            }
        },
        //重置AB面
        goChangePosition: function(){
            var setVal='';
            if (this.editObject.viewObj.start==='start_a'){
                setVal='start_b';
            }else{
                setVal='start_a';
            }
            this.openDetails(this.editObject.bolt_id, setVal);
        },
        //清零计米器
        resetCounter: function(){
            if (this.equipment.counter!=='on'){
                dialog.open('resultShow',{content:'计米器未链接，无法进行清零操作！'});
                return;
            }
            dialog.open('information',{
                content:'是否清零当前计米器的计数？',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure'){
                        EQUIPMENT.resetCounter();
                    }
                }
            });
        }
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        this.username=temp.name;
    },
    watch: {
        'input.len': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.start': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.end': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'search.listType': function(){
            this.getList();
        },
        'currentPosition': function(newVal){
            if (this.positionCallBack){
                this.positionCallBack(newVal);
            }
        }
    }
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: function(){
        dialog.open('loading');
    },
    error: function(code, msg){
        dialog.close('loading');
        dialog.open('information',{content:msg, cname:'error', btncancel:''});
    }
});
var ajaxModify=relaxAJAX({
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: vu.operateBefore,
    error: vu.operateError
});

$(function(){
    var timeID, body=$('body');
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            fitUI();
        },100);
    });

    fitUI();
    vu.getList();

    function fitUI(){
        var H=body.height();
        vu.UI.listHeight=H-44;
        vu.UI.bottomHeight=H-315;
    }
});