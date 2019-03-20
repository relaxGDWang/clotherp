var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: undefined, //默认进行中任务，cut完成的任务
            bolt_no: undefined,  //卷号
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
        positionTime:'',       //计米器读数时间函数
        positionPer: 1000,     //读取频率
        positionCallBack: '',  //长度变更时的回调函数
        UI:{
            view: 'mission',
            type: 'cut',
            listHeight: 100,   //列表高
            bottomHeight: 100,  //详细页面底部列表高
            len:''   //详细页布匹长度
        },
        input:{
            flag: false,  //标记修改操作的ajax是否在提交
            msg:'',        //错误信息提示
            status: '',    //错误信息状态
            len: '',       //修正布长
            start:'',      //疵点开始
            end:'',        //疵点结束
            step:1,        //步骤
            readonly: true   //是否自定义输入，否则按计米器数值输入
        },
        getPrintList:[],  //取货打印信息
        printTemplate:'',  //打印模板信息
        editObject: {},  //用于标注当前查看的未完成任务对象
        showObject: {},  //用于标注当前查看的已完成任务对象
        mission: [], //任务细分数组，ajax直接返回
        missionKey: {}, //bolt_id与数组index对应关系
    },
    computed:{
        isDisabled: function(){   //判断完成裁剪是否可用
            if (this.search.listType==='quick'){
                if (this.editObject.viewObj.splits.length>0){
                    return !(this.editObject.viewObj.sel.bolt_id===this.editObject.viewObj.splits[0].bolt_id);
                }else{
                    return false;
                }
            }else{
                return !(this.editObject.viewObj.sel && (this.editObject.viewObj.sel.bolt_id===this.editObject.viewObj.splits[0].bolt_id));
            }
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
        changeView: function(itemStr){
            this.UI.view=itemStr;
        },
        getList: function(){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.flagReload=false;
            ajax.send({
                url: PATH.missionCut,
                data:{status: this.search.listType, urgent: (this.search.urgent || undefined)},
                success:function(data){
                    dialog.close('loading');
                    var count=0;
                    for (var x in data){
                        data[x].position=data[x].position.split(REG.position);  //加工所在仓位
                        data[x].arrayIndex=count;
                        vu.mission.push(data[x]);
                        vu.missionKey[data[x]['bolt_id']]=vu.mission[count];
                        count++;
                    }
                    if (vu.printTemplate==='' && count!==0){
                        vu.printTemplate=vu.mission[0].print_data;
                        vu.printTemplate.info.code=undefined;
                        vu.printTemplate.info.footer=undefined;
                        vu.printTemplate.info.header='随手订货 取货单';
                    }
                }
            });
        },
        //查询条件中的卷号变更
        changeSearchNumber: function(e){
            if (e.keyCode===13){
                this.search.bolt_no=this.search.bolt_no.replace(/00\s/,'');
                e.target.blur();
                ajax.send({
                    url: PATH.quickCutting,
                    data: {bolt_no: vu.search.bolt_no},
                    success: function(data){
                        dialog.close('loading');
                        vu._setDetailsData(data, data.bolt_id);
                        vu.startEQPosition();
                        dialog.open('opDetails',{
                            closeCallback: function(){
                                vu.editObject={};
                                vu.UI.len='';
                                vu.stopEQPosition();
                                vu.$refs.numberSearch.focus();
                            }
                        });
                    }
                })
            }
        },
        //bid 每个裁剪分段的编号 bno 每个布匹的编号
        openDetails: function(bid, start){
            var dialogConfig={
                closeCallback: function(){
                    vu.editObject={};
                    vu.showObject={};
                    if (vu.flagReload) vu.getList();
                    vu.UI.len='';
                    vu.stopEQPosition();
                }
            };
            /*
            if (this.missionKey[bid].viewObj!==undefined && start===undefined){
                if (this.search.listType){
                    this.showObject=this.missionKey[bid];
                    dialog.open('finishDetails',dialogConfig);
                }else{
                    this.editObject=this.missionKey[bid];
                    this._setColthLen();
                    this.startEQPosition();
                    dialog.open('opDetails',dialogConfig);
                }
            }else{
            */
                ajax.send({
                    url: PATH.missionCutDetails,
                    data:{bolt_id: bid, start: (start || undefined)},
                    success:function(data){
                        dialog.close('loading');
                        vu._setDetailsData(data, data.bolt_id);
                        if (vu.search.listType && vu.search.listType!=='quick'){
                            dialog.open('finishDetails',dialogConfig);
                        }else{
                            vu.startEQPosition();
                            dialog.open('opDetails',dialogConfig);
                        }
                    }
                });
            /*
            }
            */
        },
        _setDetailsData: function(data, idStr){
            if (this.search.listType && this.search.listType!=='quick'){
                data.product=this.missionKey[data.bolt_id].product_code;
                Vue.set(this.missionKey[data.bolt_id],'viewObj',data);
                this.showObject=this.missionKey[data.bolt_id];
            }else{
                var flag=false;
                if (!idStr){
                    idStr=this.editObject.bolt_id;
                    flag=true;
                }
                data.defects=_formatFlawInfor(data.defects);  //瑕疵列表
                data.list={};
                data.sel=data.splits.length>0? data.splits[0] : '';
                for (i=0; i<data.splits.length; i++){
                    data.list[data.splits[i].bolt_id]=i;
                }
                if (this.search.listType==='quick'){
                    this.editObject={
                        bolt_id: data.bolt_id,
                        product_code: '--',
                        bolt_no: data.bolt_no,
                        position: data.position.split(REG.position),
                        viewObj: data
                    };
                }else{
                    Vue.set(this.missionKey[idStr],'viewObj',data);
                    if (!flag) this.editObject=this.missionKey[idStr];
                }
                this._setColthLen();

                //格式化瑕疵点列表
                function _formatFlawInfor(itemList){
                    for (var i=0; i<itemList.length; i++){
                        if (itemList[i].defect_type==='dot'){
                            itemList[i].position=itemList[i].end;
                            itemList[i].length='';
                        }else{
                            itemList[i].position=itemList[i].start+'~'+itemList[i].end;
                        }
                    }
                    return itemList;
                }
            }
        },
        setViewObject: function(bid){
            if (this.editObject.viewObj.sel.bolt_id===bid) return;
            this.editObject.viewObj.sel=this.editObject.viewObj.splits[this.editObject.viewObj.list[bid]];
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.viewObj.current_length;
                return;
            }
            this.UI.len='';
        },
        getTypeString: function(itemObject){   //获得当前裁剪端的分类名称
            if (itemObject.order){
                return 'customer';
            }else if(itemObject.defect_type && itemObject.defect_type.indexOf('瑕疵')>=0){
                return 'flaw';
            }else{
                return 'normal';
            }
        },
        askFinish: function(){
            if (this.editObject.viewObj.splits.length>0) {
                //检测当前计米和需裁剪的是否匹配
                var p = 0.05, msg, className;
                var checkValueMax = this.editObject.viewObj.sel.cut_length + p;
                var checkValueMin = this.editObject.viewObj.sel.cut_length - p;
                if (this.currentPosition && this.currentPosition >= checkValueMin && this.currentPosition <= checkValueMax) {
                    msg = '是否完成当前段 <strong>'+ this.editObject.viewObj.sel.cut_length +'</strong>米 的裁剪操作？';
                    className = 'sure';
                } else {
                    msg = '裁剪位置似乎与需要裁剪长度<strong>' + this.editObject.viewObj.sel.cut_length + '</strong>米 不匹配，是否任然完成当前裁剪？';
                    className = 'warning';
                }
            }else{
                if (this.currentPosition && this.currentPosition>0 && this.currentPosition<=this.editObject.viewObj.current_length){
                    msg = '是否确定在当前疵点位置 <strong>' + this.currentPosition + '</strong>米 进行分裁操作？';
                    className = 'sure';
                }else{
                    dialog.open('information',{
                        content: '没有准确获得当前裁剪位置。',
                        btncancel: '',
                        cname: 'warning'
                    });
                    return;
                }
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
            var isQuick=false;
            if (this.search.listType==='quick'){
                if (this.editObject.viewObj.splits.length>0){
                }else{
                    this.editObject.viewObj.sel={
                        bolt_id: this.editObject.viewObj.bolt_id
                    };
                    isQuick=true;
                }
            }
            ajax.send({
                url: isQuick? PATH.missionCutQuick: PATH.missionCutFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.sel.bolt_id, length: vu.currentPosition? vu.currentPosition : vu.editObject.viewObj.sel.cut_length},
                success:function(data){
                    //自动打印标签
                    if (vu.search.listType!=='quick') vu.printDoing();
                    vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    dialog.close('loading');
                    vu._setDetailsData(data,'');
                    if (vu.search.listType==='quick') vu.printDoing();
                    if (data.splits.length===0 && vu.search.listType!=='quick'){  //判断是否还有裁剪段
                        vu.UI.len=data.current_length;
                        dialog.open('information',{
                            content: '当前布匹上的裁剪任务已经全部处理完毕!',
                            btncancel:'',
                            cname:'ok'
                        });
                    }else{
                        dialog.open('resultShow',{content:'当前裁剪操作已成功！'});
                    }
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
            this.input.step=1;
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
            if (REG.flaw.test(this.input.len)===false || this.input.len===0){
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
                data:{bolt_id: vu.editObject.viewObj.init_bolt_id, length: vu.input.len},
                success: function(data){
                    if (data.splits.length===0){
                        vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len+'! 裁剪任务调整，该卷布已无任务裁剪任务。'});
                    }else{
                        vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len});
                    }
                    vu.positionCallBack='';
                    setTimeout(function(){
                        dialog.close('reLength');
                        vu._resetInputData();
                    },1500);
                    //调整布长
                    if (vu.search.listType!=='quick') vu.missionKey[data.bolt_id].current_length=data.current_length;
                    vu._setDetailsData(data,'');
                    vu.flagReload=true;
                }
            });
        },
        operateFlaw: function(bolt_id){
            if (bolt_id===undefined){ //添加疵点操作
                dialog.open('addFlaw',{closeCallback: vu._resetInputData});
                this.input.start=this.currentPosition===''? 0: this.currentPosition; //notice
                this.positionCallBack=function(newVal){
                    this.input.start=newVal;
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
            if (REG.flaw.test(this.input.end)===false || this.input.end===0){
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
                data:{bolt_id: vu.editObject.viewObj.init_bolt_id, defects:[vu.input.start+","+vu.input.end]},  //notice
                success: function(data){
                    vu.flagReload=true;
                    if (data.splits.length===0){
                        vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功， 裁剪任务调整，该卷布已无裁剪任务。'});
                    }else{
                        vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功，裁剪任务已经刷新！'});
                    }
                    vu.positionCallBack='';
                    vu._setDetailsData(data,'');
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
                    vu.flagReload=true;
                    dialog.close('loading');
                    if (data.splits.length===0){
                        dialog.open('information',{content:'疵点已经成功删除！裁剪任务调整，该卷布已无裁剪任务。',btncancel:'',cname:'ok'});
                    }else{
                        dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',cname:'ok'});
                    }
                    vu._setDetailsData(data,'');
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
        //打印标签
        printDoing: function(index){
            var printStr='';
            if (this.search.listType && this.search.listType!=='quick'){   //查看完成订单的打印
                switch(index){
                    case 'start':
                        if (this.showObject.viewObj.start==='start_a'){
                            printStr=this.showObject.viewObj.print_head;
                        }else{
                            printStr=this.showObject.viewObj.print_tail;
                        }
                        break;
                    case 'end':
                        if (this.showObject.viewObj.start==='start_a'){
                            printStr=this.showObject.viewObj.print_tail;
                        }else{
                            printStr=this.showObject.viewObj.print_head;
                        }
                        break;
                    default:
                        printStr=this.showObject.viewObj.cutouts[index].print_data;
                }
                printStr=JSON.stringify(printStr);
            }else{
                if (index==='show'){
                    dialog.open('printBox');
                    return;
                }
                if (this.editObject.viewObj.sel && !index){
                    printStr=this.editObject.viewObj.sel.print_data;
                }else{
                    switch (index){
                        case 'start':
                            if (this.editObject.viewObj.start==='start_a'){
                                printStr=this.editObject.viewObj.print_head;
                            }else{
                                printStr=this.editObject.viewObj.print_tail;
                            }
                            break;
                        case 'end':
                            if (this.editObject.viewObj.start==='start_a'){
                                printStr=this.editObject.viewObj.print_tail;
                            }else{
                                printStr=this.editObject.viewObj.print_head;
                            }
                            break;
                        default:
                            printStr=this.editObject.viewObj.cutouts[0].print_data;
                    }
                }
                printStr=JSON.stringify(printStr);
            }
            console.log(printStr);
            EQUIPMENT.print(printStr);
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
        },
        //选择取货信息
        selectGetCloth: function(e){
            this.getPrintList=[];
            var temp;
            for (var i=0; i<e.length; i++){
                this.getPrintList.push(e[i]);
            }
        },
        //取货打印
        printGetCloth: function(){
            var maxCount=5;
            if (this.getPrintList.length===0){
                dialog.open('resultShow',{content:'没有选择需要打印的布卷信息！'});
                return;
            }
            var template=vu.printTemplate;
            var result=[];
            var temp1,temp2;
            for (var i=0; i<this.getPrintList.length; i++){
                temp1='◆ $kind$ $store$';
                temp2='$id$   $len$';
                temp1=temp1.replace('$kind$',this.getPrintList[i].product_code);
                temp2=temp2.replace('$id$',this.getPrintList[i].bolt_no);
                temp1=temp1.replace('$store$',this.getPrintList[i].position.join(','));
                temp2=temp2.replace('$len$',this.getPrintList[i].current_length+'米');
                result.push({text:temp1});
                result.push({text:temp2});
                result.push({text:''});
                if (i>=maxCount) break;
            }
            template.info.items=result;
            var printStr=JSON.stringify(template);
            if (this.getPrintList.length>maxCount){
                dialog.open('resultShow',{content:'取货打印一次最多为'+ maxCount +'条！'});
            }
            EQUIPMENT.print(printStr);
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
        vu.UI.bottomHeight=H-325;
    }
});