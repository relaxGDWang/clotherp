if (!EQUIPMENT.app && window.parent && window.parent!==window) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        op:'',  //区分裁剪还是检验
        bid:'',  //当前操作布段的id编号或者布卷号
        defectType: [],  //疵点分类
        defect:'',      //当前选择疵点分类
        cutTypeList:{'import':'入库','discard':'废弃','book_cloth':'版本布','return_repair':'退货/返修'},
        cutType:'',
        UI:{
            firstLoad: true,
            len:'',   //详细页布匹长度
            sel:''    //标注当前选择的布段编号，如果是自由裁剪为free
        },
        currentPosition: '',
        assistPosition: '',
        assistCount: localStorage.getItem('assistCount')-0 || 0,
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
        /*
        isDisabled: function(){   //判断完成裁剪是否可用
            return !(this.editObject.sel && (this.editObject.sel.bolt_id===this.editObject.splits[0].bolt_id));
        },
        */
        showSelInfo: function(){   //显示当前选中的订单信息
            var result={index:'', id:'', purchaser:'', quantity:'--', comment:'',whole_sale:'',disabled:''};
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
                        result.unit=temp.unit;
                        result.quantity=temp.quantity+temp.unit;
                        result.comment=temp.comment;
                        result.whole_sale=temp.whole_sale;   //是否超长裁剪
                        result.disabled=temp.disabled;
                        break;
                    }
                }
            }
            return result;
        },
        locked: function(){   //计算布卷是否能操作 不能返回true
            return !(this.editObject.status_code==='imported');
        }
    },
    methods: {
        thisClose: function(){
            if (EQUIPMENT.app){
                //NOTICE 调用app的方法
                EQUIPMENT.detailsClose();
            }else{
                if (window.parent!==window) window.parent.vu.closeDetails();
            }
        },
        startEQPosition: function(){  //开始计米器读数
            this.positionTime=setInterval(EQUIPMENT.getCounter,vu.positionPer);
        },
        stopEQPosition: function(){  //关闭计米器读数
            clearInterval(vu.positionTime);
            this.positionTime='';
        },
        resetCounter: function(){   //辅助计米器清零
            if (!this.currentPosition) return;
            dialog.open('information',{
                content:'是否清零当前 <strong>辅助</strong> 计米器？',
                btncancel:'',
                btnsure:'确定',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure'){
                        vu.assistCount+=vu.currentPosition;
                        //vu.currentPosition=0;
                        vu.assistPosition=vu.assistCount;
                        //保存当前计米器累加值到本地存储
                        EQUIPMENT.resetCounter();
                    }
                }
            });
        },
        resetCounter2: function(){  //总计米器清零
            if (!this.assistPosition) return;
            dialog.open('information',{
                content:'是否清零当前 总计米 的数据？',
                btncancel:'',
                btnsure:'确定',
                cname:'sure',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure'){
                        vu.assistPosition=0;
                        vu.assistCount=0;
                        //vu.currentPosition=0;
                        EQUIPMENT.resetCounter();
                    }
                }
            });
        },
        _changeHash: function(){
            if (!this.UI.firstLoad) dialog.close();
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
                if (!hash.op || (!hash.bid && !hash.bno)) throw 'Parameters were lost';
                this.op=hash.op;
                this.bid=hash.bid || hash.bno;
                if (!this.UI.firstLoad) this._getDetails();
                return true;
            }catch(e){
                this.editObject={};
                var showObject={
                    cname:'error',
                    content:'缺少关键参数，无法获得布卷详情',
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
            var url,sendData;
            if (typeof(this.bid)==='number'){  //NOTICE
                url=PATHNEW.clothDetailsById;
                sendData={
                    id: vu.bid
                };
            }else{
                url=PATHNEW.clothDetailsByNo;
                sendData={
                    no: vu.bid
                };
            }
            ajax.send({
                url: url,
                data: sendData,
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
        _setDetailsData: function(data,flag){  //把原始的布卷详情进行加工
            /*
            data 布卷详情 / 疵点列表
            flag 添加疵点返回的是添加成功的疵点信息，删除疵点返回的是整体疵点信息
            */
            if (flag){
                data=_formatFlawInfor(data);  //瑕疵列表
                if (flag==='object'){
                    this.editObject.defects.push(data);
                }else{
                    Vue.set(this.editObject,'defects',data);
                }
            }else{
                data.position=data.position.split(REG.position);
                data.defects=_formatFlawInfor(data.defects);  //瑕疵列表
                data.qualified=this._formatQualified(data.qualified);
                //处理历史记录
                for (var i=0; i<data.history.length; i++){
                    if (data.history[i].action_type.indexOf('检验')>=0){
                        data.history[i].action_type_icon='fa-instagram';
                    }else{
                        if (data.history[i].action_type.indexOf('疵点')>=0){
                            data.history[i].action_type_icon='fa-thumb-tack';
                        }else{
                            data.history[i].action_type_icon='fa-cut';
                        }
                    }
                }
                //处理订单状态
                for (var i=0; i<data.orders.length; i++){
                    if (!data.orders[i].disabled) data.orders[i].disabled='';
                }
                Vue.set(this,'editObject',data);
                this._setColthLen();
            }

            //格式化瑕疵点列表
            function _formatFlawInfor(itemList){
                var tempList=[],flag=false;
                if (itemList.length){
                    tempList=itemList;
                }else{
                    tempList.push(itemList);
                    flag=true;
                }
                for (var i=0; i<tempList.length; i++){
                    /*
                    if (itemList[i].defect==='dot'){
                        itemList[i].position=itemList[i].end;
                        itemList[i].length='';
                    }else{
                        itemList[i].position=itemList[i].start+'~'+itemList[i].end;
                    }
                    */
                    tempList[i].defect='dot';
                    tempList[i].position=tempList[i].start;
                    tempList[i].length='';
                }
                if (flag){
                    return tempList[0];
                }else{
                    return tempList;
                }
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
            //this.input.len=this.currentPosition===''? this.UI.len : this.currentPosition;  //notice
            this.input.len=this.assistPosition===''? this.UI.len : this.assistPosition;
            this.positionCallBack=function(newVal){
                this.input.len=newVal;
            };
        },
        doResetLength: function(setLen){ //重写布匹长度ajax
            if (setLen!==undefined && !isNaN(setLen-0)){
                vu.input.len=setLen;
                _tempDo();
                return;
            }
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
                //获得疵点分类信息 2019/09/10
                //Vue.set(this,'defectType',EQUIPMENT.getGeneralSetting('flaw'));
                dialog.open('addFlaw',{closeCallback: vu._resetInputData});
                //this.input.start=this.currentPosition===''? 0: this.currentPosition; //notice
                this.input.start=this.assistPosition===''? 0: this.assistPosition;
                //this.positionCallBack=function(newVal){
                    //this.input.start=newVal;
                //};
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
        cutBlock: function(){  //询问是否进行分段裁剪
            //判断当前计米器读数
            //if (!this.currentPosition){ notice
            if (!this.assistPosition){
                dialog.open('information',{
                    content:'由于计米器读数无法获取或者为0，当前操作无法继续！',
                    btncancel:'',
                    btnclose:'',
                    btnsure:'确定',
                    cname:'warning',
                });
                return;
            }
            this.input.len=this.assistPosition;
            dialog.open('cutCloth',{
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
                //url: PATH.addFlaw,
                url: PATHNEW.flawAdd,
                method: 'post',
                //data:{id: vu.editObject.init_bolt_id, start:vu.input.start, end:vu.input.end, type:vu.defect},
                data:{id: vu.editObject.init_bolt_id, start:vu.input.start, type:vu.defect},
                success: function(data){
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功，裁剪任务已经刷新！'});
                    vu.positionCallBack='';
                    //vu._setDetailsData(data);
                    vu._setDetailsData(data,'object');
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu._resetInputData();
                    },2000);
                }
            });
        },
        delOperateFlaw: function(defect_id){   //删除疵点ajax
            var sendData={
                id: vu.editObject.bolt_id,
                defect_id: defect_id
            };
            ajax.send({
                url: PATHNEW.flawDel,
                method: 'delete',
                data: sendData,
                success: function(data){
                    dialog.close('loading');
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',btnclose:'',btnsure:'确定',cname:'ok'});
                    vu._setDetailsData(data,'array');
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
        printRequest: function(printObject,count){  //调用打印指令
            EQUIPMENT.print(printObject,count);
        },
        getDefectType: function(){  //获得疵点分类
            ajaxElse.send();
        },
        askFinish: function(){
            //检测当前计米和需裁剪的是否匹配
            //if (!this.currentPosition) { notice
            if (!this.assistPosition) {
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
            //if (this.currentPosition===this.editObject.current_length){ notice
            if (this.assistPosition===this.editObject.current_length){
                msg='请选择该布卷的检验结果为';
            }else{
                //msg='布匹的长度将更新为 <strong>'+ this.currentPosition +'</strong>米 ，请选择该布匹的检验结果为'; notice
                msg='布卷的长度将更新为 <strong>'+ this.assistPosition +'</strong>米 ，请选择该布卷的检验结果为';
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
        doFinish: function(pass){  //检验的提交
            //var nowCurrentPosition=this.currentPosition; notice
            var nowCurrentPosition=this.assistPosition;
            ajax.send({
                url: PATH.missionCheckFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.bolt_id, qualified: pass, length: nowCurrentPosition},
                success:function(data){
                    EQUIPMENT.resetCounter(true);
                    vu.assistPosition=0;
                    vu.assistCount=0;
                    vu._setDetailsData(data);
                    dialog.close('loading');
                    dialog.open('information', {
                        content: '布卷检验已完成！',
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
                    vu.printRequest(vu.editObject.print_data);
                }
            });
        },
        askCut2: function(status){  //自由裁剪，任务裁剪处理
            var msg,className,doFlag=false;
            //if (!this.currentPosition){  //notice
            if (!this.assistPosition){
                msg='没有准确获得计米器当前的读数！';
                className='warning';
            //}else if(this.currentPosition===0){  //notice
            }else if(this.assistPosition===0){
                msg='计米器读数为0，无法在该位置裁剪！';
                className='warning';
            }else{
                //msg='是否确定在当前位置 <strong>'+ this.currentPosition +'</strong>米 进行裁剪操作？'; notice
                msg='是否确定在当前位置 <strong>'+ this.assistPosition +'</strong>米 进行裁剪操作？';
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
        askCut: function(op){ //布卷分裁处理
            //this.input.end=this.currentPosition-0; //notice
            this.input.end=this.input.len-0;
            this.input.start=this.input.end;
            ajax.send({
                url: PATHNEW.clothCut,
                method: 'post',
                //data:{bolt_id: vu.editObject.init_bolt_id, start:vu.input.start, end:vu.input.end, cut:1, type:'',comment:vu.cutType},
                data:{id: vu.editObject.bolt_id, length:vu.input.start, split_type:vu.cutType},
                success: function(data){
                    dialog.close('loading');
                    vu._setDetailsData(data,'');
                    vu.cutType='';
                    vu.input.start=0;
                    vu.input.end=0;
                    vu.input.len=0;
                    //vu.flagReload=true;
                    //清零计米
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                        vu.assistPosition=0;
                        vu.assistCount=0;
                    },200);
                    dialog.open('resultShow',{content:'布段分裁成功!'});
                    if (vu.editObject.history[0].print_data){  //如果是废弃，应该不包含打印信息，其他情况需要打印
                        vu.printRequest(vu.editObject.history[0].print_data,1);
                    }
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
                            if (buttonType==='sure' && code===408){
                                //如果关键操作超时，重新加载页面
                                location.reload();
                            }
                        }
                    });
                }
            });
        },
        doCut: function(status){  //自由裁剪 任务裁剪的提交
            var sendData={id: vu.editObject.bolt_id, length: vu.assistPosition};
            if (this.showSelInfo.index!=='' && status){   //订单裁剪并且选中的订单
                sendData.order_item_id=this.showSelInfo.id;
                //sendData.status='cut';
            }
            ajax.send({
                //url: PATH.missionCutQuick,
                url: PATHNEW.clothCut,
                method: 'post',
                data: sendData,
                success:function(data){
                    dialog.close('loading');
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                        vu.assistPosition=0;
                        vu.assistCount=0;
                    },200);
                    if (vu.showSelInfo.index!==''){
                        dialog.open('resultShow',{content:'订单布段裁剪完成！'});
                    }else{
                        dialog.open('resultShow',{content:'当前布卷的自由裁剪操作已完成！'});
                    }
                    vu._setDetailsData(data);
                    //还原左侧未选中状态
                    if (vu.UI.sel!=='free') vu.UI.sel='';
                    //modify by relax 2019/10/25 按服务端返回打印
                    if (vu.editObject.history[0].print_data.auto_prints!==0){
                        if (vu.editObject.history[0].print_data.auto_prints===-1){
                            vu.printRequest(vu.editObject.history[0].print_data);
                        }else{
                            vu.printRequest(vu.editObject.history[0].print_data, vu.editObject.history[0].print_data.auto_prints);
                        }
                    }
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
                            if (buttonType==='sure' && code===408){
                                //如果关键操作超时，重新加载页面
                                location.reload();
                            }
                        }
                    });
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
                if (window.parent===window){
                    location.href='pageRecordView.html#'+ encodeURIComponent('{"op":"record","bid":'+bid+'}');
                }else{
                    window.parent.vu.openRecordView(bid);
                }
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
        /*
        'input.end': function(newVal,oldVal){
            if (oldVal==newVal) return;
            this.input.status='';
            this.input.msg='';
        },
        'input.step': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        */
        'currentPosition': function(newVal,oldVal){
            this.assistPosition=newVal+this.assistCount;
            //调用长度写入函数
            if (this.positionCallBack){
                this.positionCallBack(this.assistPosition);
            }
            //播放音频
            var start=oldVal+this.assistCount, end=newVal+this.assistCount;
            if (this.editObject && this.showSelInfo.index!==''){
                var dis=this.showSelInfo.quantity.replace('米','')-0;
                if ((start==='' || start<dis) && end>=dis){
                    this.audioPlay();
                }else if(start && start>dis && end<=dis){
                    this.audioPlay();
                }
            }
        },
        'assistCount': function(newVal, oldVal){
            localStorage.setItem('assistCount',newVal);
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
                    /*
                    if (!vu.editObject.bolt_id){
                        //vu.thisClose();
                        //return false;
                    }
                    */
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
$(function(){
    //获得详情
    vu._getDetails();

    //获得疵点分类
    vu.getDefectType();

    //添加版本号
    $('.emptyShow .ver').text('V'+CFG.VER);
});