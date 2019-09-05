if (!EQUIPMENT.app) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        op:'',  //区分裁剪还是检验
        bid:'',  //当前操作布段的id编号
        defectType:[],  //疵点分类
        defect:'',      //当前选择疵点分类
        UI:{
            firstLoad: true,
            len:'',   //详细页布匹长度
            sel:''    //标注当前选择的布段编号，如果是自由裁剪为free
        },
        currentPosition: '',
        positionTime:'',  //计米器读数时间函数
        positionPer: 1000, //读取频率
        positionCallBack: '',  //长度变更时的回调函数
        input:{
            flag: false,   //标记修改操作的ajax是否在提交
            msg:'',        //错误信息提示
            status: '',    //错误信息状态
            len: '',       //修正布长
            start:'',      //疵点开始
            end:'',        //疵点结束
            step:1,        //步骤
            readonly: true //是否自定义输入，否则按计米器数值输入
        },
        editObject:{}
    },
    computed:{
        isDisabled: function(){   //判断完成裁剪是否可用
            return !(this.editObject.sel && (this.editObject.sel.bolt_id===this.editObject.splits[0].bolt_id));
        },
        showSelInfo: function(){   //显示当前选中的订单信息
            var result={index:'', id:'', purchaser:'', quantity:''};
            if (!this.UI.sel){
            }else if (this.UI.sel==='free'){
                result.purchaser=result.quantity='--';
            }else{
                var temp;
                for (var i=0; i<this.editObject.orders.length; i++){
                    temp=this.editObject.orders[i];
                    if (this.UI.sel===temp.order_item_id){
                        result.index=i;
                        result.id=temp.order_item_id;
                        result.purchaser=temp.purchaser;
                        result.quantity=temp.quantity+'米';
                        break;
                    }
                }
            }
            return result;
        }
    },
    methods: {
        thisClose: function(){
            if (EQUIPMENT.app){
                //NOTICE 调用app的方法
                EQUIPMENT.detailsClose();
            }else{
                window.parent.vu.closeDetails();
            }
        },
        startEQPosition: function(){  //开始计米器读数
            this.positionTime=setInterval(EQUIPMENT.getCounter,vu.positionPer);
        },
        stopEQPosition: function(){  //关闭计米器读数
            clearInterval(vu.positionTime);
            this.positionTime='';
        },
        resetCounter: function(){   //清零计米器
            dialog.open('information',{
                content:'是否清零当前计米器的计数？',
                btncancel:'',
                btnsure:'确定',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') EQUIPMENT.resetCounter();
                }
            });
        },
        _changeHash: function(){
            if (!this.UI.firstLoad) dialog.close('information');
            var hash=decodeURIComponent(location.hash.replace(/^#/,''));
            if (!hash){
                //打开默认页面
                this.op='';
                this.bid='';
                this.editObject={};
                return false;
            }
            try{
                hash = JSON.parse(hash);
                if (!hash.op || !hash.bid) throw 'Parameters were lost';
                this.op=hash.op;
                this.bid=hash.bid;
                if (!this.UI.firstLoad) this._getDetails();
                return true;
            }catch(e){
                this.editObject={};
                var showObject={
                    cname:'error',
                    content:'缺少关键参数，无法获得布匹详情',
                    btncancel:'', btnclose:'', btnsure:'确定',
                    closeCallback: function(id, dialogType, buttonType){
                        //vu.thisClose();
                    }
                };
                if (this.UI.firstLoad){
                    setTimeout(function(){
                        dialog.open('information',showObject);
                    },1000);
                }else{
                    dialog.open('information',showObject);
                }
            }
        },
        //打开布卷详情
        //start布卷起始端，可选值为start_a,start_b
        //目前提交的url不做检验/裁剪的区分，按目前返回数值来看格式似乎是一样的
        _getDetails: function(start){
            //清空可能已有的数据
            this.editObject={};
            if (!this.bid) return;
            ajax.send({
                url: PATH.missionCheckDetails,
                data: {bolt_id: vu.bid, start: (start || undefined)},
                success:function(data){
                    dialog.close('loading');
                    vu._setDetailsData(data);
                    vu.startEQPosition();
                }
            });
        },
        _formatQualified: function(status){  //处理检验状态
            var result={class:'',name:status? status: ''};
            switch(status){
                case '合格':
                    result.class='yes';
                    break;
                case '不合格':
                    result.class='no';
                    break;
            }
            return result;
        },
        _setDetailsData: function(data){  //把原始的布卷详情进行加工
            data.position=data.position.split(REG.position);
            data.defects=_formatFlawInfor(data.defects);  //瑕疵列表
            data.qualified=this._formatQualified(data.qualified);
            data.list={};  //新增list属性，用于关联id编号和数组序号的对象
            this.UI.sel='free';
            for (i=0; i<data.splits.length; i++){
                data.list[data.splits[i].bolt_id]=i;
            }
            Vue.set(this,'editObject',data);
            this._setColthLen();

            //格式化瑕疵点列表
            function _formatFlawInfor(itemList){
                for (var i=0; i<itemList.length; i++){
                    if (itemList[i].defect==='dot'){
                        itemList[i].position=itemList[i].end;
                        itemList[i].length='';
                    }else{
                        itemList[i].position=itemList[i].start+'~'+itemList[i].end;
                    }
                }
                return itemList;
            }
        },
        setViewObject: function(bid){  //设置当前裁剪布段
            if (bid==='free'){
                if (this.UI.sel==='free') return;
                this.UI.sel='free';
            }else{
                if (this.UI.sel===bid) return;
                this.UI.sel=bid;
            }
        },
        goChangePosition: function(){  //重置AB面
            var setVal='';
            if (this.editObject.start==='start_a'){
                setVal='start_b';
            }else{
                setVal='start_a';
            }
            this._getDetails(setVal);
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.current_length;
            }else{
                this.UI.len='';
            }
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
            if (REG.flaw.test(this.input.len)===false){
                this._setMessage({status:'warning',msg:'布长填写错误，请重新输入'});
                return;
            }
            if (this.input.len-0===this.editObject.current_length-0){
                this._setMessage({status:'warning',msg:'填写值和当前长度一致，无需提交'});
                return;
            }
            if (this.input.len-0===0){
                dialog.open('information',{
                    content:'标记布长为0表示当前布卷已被裁剪完，是否继续？',
                    btncancel:'',
                    btnsure:'继续提交',
                    cname:'sure',
                    closeCallback: function(id, dialogType, buttonType){
                        if (buttonType==='sure') _tempDo();
                    }
                });
            }else{
                _tempDo();
            }

            function _tempDo() {  //发送重置布长的操作
                ajaxModify.send({
                    url: PATH.resetLength,
                    method: 'post',
                    data: {bolt_id: vu.editObject.init_bolt_id, length: vu.input.len},
                    success: function (data) {
                        vu._setMessage({flag: true, status: 'ok', msg: '布长已经成功标记为' + vu.input.len});
                        vu.positionCallBack = '';
                        setTimeout(function () {
                            dialog.close('reLength');
                            vu._resetInputData();
                        }, 1500);
                        //调整布长
                        vu.editObject.current_length = data.current_length;
                        vu._setDetailsData(data);
                    }
                });
            }
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
                    btncancel:'',
                    btnsure:'确定',
                    cname:'sure',
                    closeCallback: function(id, dialogType, buttonType){
                        if (buttonType==='sure'){
                            vu.delOperateFlaw(bolt_id);
                        }
                    }
                });
            }
        },
        cutBlock: function(){  //询问是否要裁剪疵块
            dialog.open('information',{
                content:'是否确定裁剪当前长度为'+(vu.currentPosition || 0)+'米的疵块？',
                btncancel:'',
                btnsure:'确定',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure'){
                        vu.askCut('block');
                    }
                }
            });
        },
        goStep: function(op){   //分步骤展现操作
            this.input.start-=0;
            this.input.end-=0;
            switch(op){
                case 'next':
                    if (REG.flaw.test(this.input.start)===false){
                        this._setMessage({status:'warning',msg:'疵点开始位置填写有误'});
                        return;
                    }
                    if (this.input.start>this.editObject.current_length){
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
            this.input.start-=0;
            this.input.end-=0;
            if (this.input.step===1){
                if (this.input.start===0){
                    this._setMessage({status:'warning',msg:'疵点标记位置不能为0，请重新定位'});
                    return;
                }
                this.input.end=this.input.start;
            }else{
                if (REG.flaw.test(this.input.end)===false || this.input.end===0){
                    this._setMessage({status:'warning',msg:'疵块结束位置填写有误'});
                    return;
                }
                if (this.input.end<this.input.start){
                    this._setMessage({status:'warning',msg:'疵块结束位置不能小于开始位置，请重新输入'});
                    return;
                }
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.init_bolt_id, start:vu.input.start, end:vu.input.end, type:vu.defect},  //notice
                success: function(data){
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功，裁剪任务已经刷新！'});
                    vu.positionCallBack='';
                    vu._setDetailsData(data);
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
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',btnclose:'',btnsure:'确定',cname:'ok'});
                    vu._setDetailsData(data);
                }
            });
        },
        _setMessage: function(config){   //设置弹出对话框中的提示信息
            if (!config) config={};
            this.input.flag=config.flag || false;
            this.input.status=config.status || '';
            this.input.msg=config.msg || '';
        },
        operateBefore: function(){  //设置弹出对话框中的ajax before事件
            this._setMessage({flag:true,status:'loading',msg:'正在提交设置数据，请稍等...'});
        },
        operateError: function(code, msg){  //设置弹出对话框中ajax error事件
            this._setMessage({status:'error', msg:msg});
        },
        //打印标签
        printDoing: function(index,count){
            var printStr='';
            if (index==='show'){
                dialog.open('printBox');
                return;
            }
            if (this.editObject.sel && !index){
                printStr=this.editObject.sel.print_data;
            }else{
                switch (index){
                    case 'start':
                        if (this.editObject.start==='start_a'){
                            printStr=this.editObject.print_head;
                        }else{
                            printStr=this.editObject.print_tail;
                        }
                        break;
                    case 'end':
                        if (this.editObject.start==='start_a'){
                            printStr=this.editObject.print_tail;
                        }else{
                            printStr=this.editObject.print_head;
                        }
                        break;
                    default:
                        printStr=this.editObject.cutouts[0].print_data;
                }
            }
            printStr=JSON.stringify(printStr);
            console.log(printStr);
            EQUIPMENT.print(printStr,count);
        },
        printDoginHistory: function(dataObject,opsition,count){   //打印历史记录的标签
            var printStr;
            if (opsition==='start' || opsition==='end'){
                if (dataObject.current_length<=0){
                    dialog.open('resultShow',{content:'布匹剩余长度为0，无法响应该操作'});
                    return;
                }
            }
            if (opsition==='start'){
                if (dataObject.start==='start_a'){
                    printStr=dataObject.print_head;
                }else{
                    printStr=dataObject.print_tail;
                }
            }else if(opsition==='end'){
                if (dataObject.start==='start_a'){
                    printStr=dataObject.print_tail;
                }else{
                    printStr=dataObject.print_head;
                }
            }else{
                printStr=dataObject? dataObject.print_data:'';
            }
            printStr=JSON.stringify(printStr);
            console.log(printStr);
            EQUIPMENT.print(printStr,count);
        },
        getDefectType: function(){  //获得疵点分类
            ajaxElse.send();
        },
        askFinish: function(){
            //检测当前计米和需裁剪的是否匹配
            if (!this.currentPosition) {
                dialog.open('information', {
                    cname: 'warning',
                    btncancel: '',
                    btnclose: '',
                    btnsure: '确定',
                    content: '当前没有获得计米器的读数，请检查计米器连接。'
                });
                return;
            }
            var msg;
            if (this.currentPosition===this.editObject.current_length){
                msg='请选择该布匹的检验结果为';
            }else{
                msg='布匹的长度将更新为 <strong>'+ this.currentPosition +'</strong>米 ，请选择该布匹的检验结果为';
            }
            dialog.open('information',{
                content: msg,
                cname: 'sure',
                btncancel: '不合格',
                btnsure: '合格',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish(1);
                    if (buttonType==='cancel') vu.doFinish(0);
                }
            });
        },
        doFinish: function(pass){
            var nowCurrentPosition=this.currentPosition;
            ajax.send({
                url: PATH.missionCheckFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.bolt_id, qualified: pass, length: nowCurrentPosition},
                success:function(data){
                    EQUIPMENT.resetCounter(true);
                    vu._setDetailsData(data);
                    dialog.close('loading');
                    dialog.open('information', {
                        content: '布匹检验已完成！',
                        btnclose:'',
                        btncancel: '',
                        btnsure:'确定',
                        cname:'ok',
                        closeCallback: function(){
                            vu.UI.len='';
                            vu.stopEQPosition();
                            //NOTICE 关闭operate窗口
                            vu.thisClose();
                        }
                    });
                    //胚布打印4次末尾标签
                    if (vu.editObject.craft_val===1){
                        vu.printDoing('end',4);
                    }else{
                        vu.printDoing('end',2);
                    }
                }
            });
        },
        askCut2: function(status){  //自由裁剪，任务裁剪处理
            var msg,className,doFlag=false;
            if (!this.currentPosition){
                msg='没有准确获得计米器当前的读数！';
                className='warning';
            }else if(this.currentPosition===0){
                msg='计米器读数为0，无法在该位置裁剪！';
                className='warning';
            }else{
                msg='是否确定在当前位置 <strong>'+ this.currentPosition +'</strong>米 进行裁剪操作？';
                className='sure';
                doFlag=true;
            }
            if (doFlag){
                dialog.open('information',{
                    content: msg,
                    cname: className,
                    btncancel: '',
                    btnsure:'确定',
                    closeCallback: function (id, dialogType, buttonType) {
                        if (buttonType === 'sure') vu.doCut(status);
                    }
                });
            }else{
                dialog.open('information',{
                    content: msg,
                    cname: className,
                    btncancel: '',
                    btnclose:'',
                    btnsure:'确定'
                });
            }
        },
        askCut: function(op){ //疵点分裁处理
            this.input.start-=0;
            this.input.end-=0;
            var ajaxObject;
            if (op==='dot'){  //疵点分裁处理
                if (this.input.start===0){
                    this._setMessage({status:'warning',msg:'疵点标记位置不能为0，请重新定位'});
                    return;
                }
                this.input.end=this.input.start;
                ajaxObject=ajaxModify;
            }else{  //疵块分裁
                this.input.start=0;
                this.input.end=this.currentPosition-0;
                if (this.input.end===0){
                    dialog.open('resultShow',{content:'疵块结束标记位置不能为0，请重新定位'});
                    return;
                }
                ajaxObject=ajax;
            }
            ajaxObject.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.init_bolt_id, start:vu.input.start, end:vu.input.end, cut:1},  //notice
                success: function(data){
                    dialog.close('loading');
                    vu._setDetailsData(data,'');
                    //vu.flagReload=true;
                    //清零计米
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                    },200);
                    if (vu.input.start===vu.input.end){
                        vu._setMessage({flag:true, status:'ok', msg:'疵点裁剪成功!'});
                        //打印信息
                        vu.printDoginHistory(vu.editObject.cutouts[0],'',4);
                        setTimeout(function(){
                            dialog.close('addFlaw');
                            vu._resetInputData();
                        },2000);
                    }else{
                        vu._setMessage();
                        vu.input.start=0;
                        vu.input.end=0;
                        dialog.open('resultShow',{content:'疵块裁剪成功!'});
                    }
                }
            });
        },
        doCut: function(status){
            var sendId=this.editObject.bolt_id;
            var sendData={bolt_id: sendId, length: vu.currentPosition};
            if (this.showSelInfo.index!=='' && status){   //订单裁剪并且选中的订单
                sendData.order_item_id=this.showSelInfo.id;
                sendData.status='cut';
            }else if(status){  //订单裁剪，但未选中订单（自由裁剪）
                sendData.status='cut';
            }
            ajax.send({
                url: PATH.missionCutQuick,
                method: 'post',
                data: sendData,
                success:function(data){
                    dialog.close('loading');
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                    },200);
                    if (vu.showSelInfo.index!==''){
                        dialog.open('resultShow',{content:'订单布段裁剪完成！'});
                    }else{
                        dialog.open('resultShow',{content:'当前布匹的分裁操作已成功！'});
                    }
                    vu._setDetailsData(data);
                    //自动打印标签
                    vu.printDoginHistory(vu.editObject.cutouts[0],'',2);
                }
            });
        },
        audioPlay: function(){
            if (EQUIPMENT.app){
                //NOTICE 调用app对应的方法
                EQUIPMENT.audioPlay();
            }else{
                $('#aduioShow')[0].play();
            }
        },
        openRecordDetails: function(bid){   //获得操作日志详细
            if (EQUIPMENT.app){
                //NOTICE 调用app对应的方法
                EQUIPMENT.detailsOpen('record',bid);
            }else{
                window.parent.vu.openRecordView(bid);
            }
        }
    },
    beforeMount: function () {
        window.onhashchange=function(){
            vu._changeHash();
        };
        this._changeHash();
    },
    mounted: function(){
        this.UI.firstLoad=false;
    },
    watch: {
        'input.len': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.start': function(newVal,oldVal){
            if (oldVal==newVal) return;
            this.input.status='';
            this.input.msg='';
        },
        'input.end': function(newVal,oldVal){
            if (oldVal==newVal) return;
            this.input.status='';
            this.input.msg='';
        },
        'input.step': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'currentPosition': function(newVal,oldVal){
            if (this.positionCallBack){
                this.positionCallBack(newVal);
            }
            if (this.editObject && this.showSelInfo.index!==''){
                var dis=this.showSelInfo.quantity.replace('米','')-0;
                if ((oldVal==='' || oldVal<dis) && newVal>=dis){
                    this.audioPlay();
                }else if(oldVal && oldVal>dis && newVal<=dis){
                    this.audioPlay();
                }
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
        dialog.open('information',{
            content:msg,
            cname:'error',
            btncancel:'',
            btnclose:'',
            btnsure:'确定',
            closeCallback: function(id, dialogType, buttonType){
                if (buttonType==='sure'){
                    if (!vu.editObject.bolt_id){
                        //vu.thisClose();
                        //return false;
                    }
                }
            }
        });
    }
});

var ajaxModify=relaxAJAX({
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: vu.operateBefore,
    error: vu.operateError
});

//疵点类型的ajax
var ajaxElse=relaxAJAX({
    url: PATH.defectType,
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    error: function(){
        dialog.open('resultShow',{content:'疵点分类信息获取失败'});
    },
    success: function(data){
        vu.defectType=data;
    }
});

//如果是移动端访问，添加app类
if (!EQUIPMENT.app) $('body').removeClass('app');
$(function(){
    //获得详情
    vu._getDetails();

    //获得疵点分类
    vu.getDefectType();

    //添加版本号
    $('.emptyShow .ver').text('V'+CFG.VER);
});