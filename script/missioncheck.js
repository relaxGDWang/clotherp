var PCOUNT=0;
var vu=new Vue({
    el: '#app',
    data:{
        search:{
            craft: '',           //成品prod 胚布raw
            book_id: '',         //样本编号
            urgent: '',          //是否加急，加急1，否则留空
            bolt_no: '',
            craftList: [{key:'prod',label:'成品'},{key:'raw',label:'胚布'}],
            bookList: []
        },
        cutpage:{
            page: 1,
            page2: 1,
            pageSize: 20,
            total: 0,
            count: 0
        },
        cutpage2:{
            page: 1,
            page2: 1,
            pageSize: 20,
            total: 0,
            count: 0
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
            view: 'mission',
            type: 'check',
            listHeight: 100,
            bottomListHeight: 100,
            len: 0
        },
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
        getPrintList:[],   //取货打印信息
        printTemplate:'',  //打印模板信息
        editObject: {},
        mission: [],      //任务细分数组，ajax直接返回
        missionKey: {},   //bolt_id与数组index对应关系
        books: [],        //样本信息
        record: [],       //操作记录数组
        recordKey: {},    //对照表
        recordObject: {}  //操作记录详情
    },
    computed:{
        isDisabled: function(){
            return this.editObject.finished;
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
            switch(itemStr){
                case 'mission':
                    if (this.mission.length===0) vu.getList();
                    break;
                case 'record':
                    if (this.record.length===0) vu.getRecordList();
                    break;
                case 'quick':
                    setTimeout(function(){
                        vu.$refs.numberSearch.focus();
                    },200);
                    break;
            }
        },
        getViewList: function(){
            if (this.UI.view==='record'){
                this.getRecordList();
            }else if(this.UI.view==='mission'){
                this.getList();
            }
        },
        getList: function(pageNum){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.flagReload=false;
            if (pageNum) this.cutpage.page=pageNum;
            ajax.send({
                url: PATH.missionCheck,
                data:{urgent: (this.search.urgent || undefined), craft: (this.search.craft || undefined), book_id: (this.search.book_id || undefined), page: vu.cutpage.page},
                success:function(data){
                    dialog.close('loading');
                    //加工分页数据
                    vu.cutpage.page2=vu.cutpage.page=data.page-0;
                    vu.cutpage.count=data.pages;
                    vu.cutpage.total=data.total;
                    data=data.items;
                    for (var i = 0; i < data.length; i++) {
                        data[i].position=data[i].position.split(REG.position);  //加工所在仓位
                        //加工日期时间
                        if (!data[i].examined_at){
                            data[i].examined_at=['--'];
                        }else{
                            data[i].examined_at=data[i].examined_at.split(/\s/);
                        }
                        if (data[i].examined_at.length===1) data[i].examined_at[1]='';
                        //加工合格状态
                        data[i].qualified=vu._formatQualified(data[i].qualified);
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']] = vu.mission[i];
                    }
                    if (vu.printTemplate==='' && data.length!==0){
                        vu.printTemplate=vu.mission[0].print_data;
                        vu.printTemplate.info.code=undefined;
                        vu.printTemplate.info.footer=undefined;
                        vu.printTemplate.info.header='随手订货 取货单';
                    }
                },
                error:function(code,msg){
                    dialog.close('loading');
                    dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
                    vu.cutpage.page=vu.cutpage.page2;
                }
            });
        },
        //获得操作记录
        getRecordList: function(pageNum){
            this.record=[];
            this.recordKey={};
            if (pageNum) this.cutpage2.page=pageNum;
            ajax.send({
                url: PATH.recordList,
                data: {page: this.cutpage2.page},
                success: function (data) {
                    dialog.close('loading');
                    //加工分页数据
                    vu.cutpage2.page2=vu.cutpage2.page=data.page-0;
                    vu.cutpage2.count=data.pages;
                    vu.cutpage2.total=data.total;
                    data=data.items;
                    for (var i=0; i<data.length; i++){
                        //加工日期时间
                        if (!data[i].updated_at){
                            data[i].updated_at=['--'];
                        }else{
                            data[i].updated_at=data[i].updated_at.split(/\s/);
                        }
                        if (data[i].updated_at.length===1) data[i].updated_at[1]='';
                        //加工合格状态
                        data[i].qualified=vu._formatQualified(data[i].qualified);
                        vu.record.push(data[i]);
                        if (!vu.recordKey[data[i]['bolt_id']]) vu.recordKey[data[i]['bolt_id']] = vu.record[i];
                    }
                },
                error:function(code,msg){
                    dialog.close('loading');
                    dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
                    vu.cutpage2.page=vu.cutpage2.page2;
                }
            });
        },
        //分页
        changePage: function(page){
            if (this.UI.view==='mission'){
                this.getList(page);
            }else if(this.UI.view==='record'){
                this.getRecordList(page);
            }
        },
        //获得样本信息
        getBookList: function(){
            this.search.bookList=[];
            ajaxModify.send({
                url: PATH.getBook,
                method: 'get',
                success: function(data){
                    for (var x in data){
                        vu.search.bookList.push({key:x, label:data[x]});
                    }
                },
                before: '',
                error: ''
            });
        },
        //查询条件中的卷号变更
        changeSearchNumber: function(e){
            if (e===undefined || e.keyCode===13){
                this.search.bolt_no=this.search.bolt_no.replace(/00\s/,'');
                this.search.craft='';
                this.search.book_id='';
                if (e) e.target.blur();
                this.openDetails();
            }
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
            /*if (this.missionKey[bid].viewObj!==undefined && start===undefined){
                this.editObject=this.missionKey[bid];
                this._setColthLen();
                this.startEQPosition();
                dialog.open('opDetails',dialogConfig);
            }else{*/
                var sendData,url;
                if (!bid){
                    sendData={bolt_no: this.search.bolt_no};
                    url=PATH.quickCutting;
                }else{
                    sendData={bolt_id: bid, start: (start || undefined)};
                    url=PATH.missionCheckDetails;
                }
                ajax.send({
                    url: url,
                    data: sendData,
                    success:function(data){
                        dialog.close('loading');
                        vu._setDetailsData(data,data.bolt_id);
                        vu.startEQPosition();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            //}
        },
        //获得操作日志详细
        openRecordDetails: function(id){
            var dialogConfig={
                closeCallback: function(){
                    vu.recordDetails={};
                }
            };
            ajax.send({
                url: PATH.recordDetails,
                data: {id: id},
                success: function(data){
                    dialog.close('loading');
                    vu.recordObject=data;
                    vu.recordObject.product_code=vu.recordKey[id].product_code;
                    dialog.open('opRecordDetails',dialogConfig);
                }
            });
        },
        _setDetailsData: function(data, idStr){
            var flag=false;
            if (!idStr){
                idStr=this.editObject.bolt_id;
                flag=true;
            }
            data.defects=_formatFlawInfor(data.defects);
            data.qualified=this._formatQualified(data.qualified);
            data.list={};
            data.sel=data.splits.length>0? data.splits[0] : '';
            for (i=0; i<data.splits.length; i++){
                data.list[data.splits[i].bolt_id]=i;
            }
            if (!this.missionKey[data.bolt_id]){
                data.position=data.position.split(REG.position);  //加工所在仓位
                //加工日期时间
                if (!data.examined_at){
                    data.examined_at=['--'];
                }else{
                    data.examined_at=data.examined_at.split(/\s/);
                }
                if (data.examined_at.length===1) data.examined_at[1]='';
                this.editObject={
                    bolt_id: data.bolt_id,
                    bolt_no: data.bolt_no,
                    product_code: data.product_code,
                    current_length: data.current_length,
                    position: data.position,
                    examine: data.examine,
                    examiner: data.examiner,
                    examined_at: data.examined_at,
                    viewObj: data
                };
            }else{
                Vue.set(this.missionKey[idStr],'viewObj',data);
                Vue.set(this.missionKey[idStr],'finished',false);  //标记当前布匹是否完成检验
                if (!flag) Vue.set(this,'editObject',this.missionKey[idStr]);
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
        },
        //处理检验状态
        _formatQualified: function(status){
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
        setViewObject: function(bid){
            if (this.editObject.viewObj.sel.bolt_id===bid) return;
            this.editObject.viewObj.sel=this.editObject.viewObj.splits[this.editObject.viewObj.list[bid]];
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.viewObj.current_length;
            }else{
                this.UI.len='';
            }
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
            //检测当前计米和需裁剪的是否匹配
            var p=0.5,msg,className;
            var checkValueMax=this.editObject.current_length + p;
            var checkValueMin=this.editObject.current_length - p;
            if (this.currentPosition && this.currentPosition>=checkValueMin && this.currentPosition<=checkValueMax){
                msg='请标记当前布匹的检验结果为';
                className='sure';
            }else{
                msg='计米长度与布匹长度不匹配，<br/>如果仍需提交，请标记当前布匹的检验结果为';
                className='warning';
            }
            dialog.open('information',{
                content: msg,
                cname: className,
                btncancel: '不合格',
                btnsure: '合格',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish(1);
                    if (buttonType==='cancel') vu.doFinish(0);
                }
            });
        },
        doFinish: function(pass){
            ajax.send({
                url: PATH.missionCheckFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, qualified: pass},
                success:function(data){
                    vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    //重置当前
                    if (pass){
                        vu.editObject.viewObj.qualified=vu._formatQualified('合格');
                        vu.editObject.qualified=vu._formatQualified('合格');
                    }else{
                        vu.editObject.viewObj.qualified=vu._formatQualified('不合格');
                        vu.editObject.qualified=vu._formatQualified('不合格');
                    }
                    dialog.close('loading');
                    dialog.open('information', {content: '布匹检验已完成！',btnclose:'',btncancel: '',btnsure:'确定',cname:'ok'});
                    //把当前对象标记为已完成
                    vu.editObject.finished=true;
                }
            });
        },
        askCut: function(){
            var msg,className,doFlag=false;
            if (!this.currentPosition){
                msg='没有准确获得计米器当前的读数！';
                className='warning';
            }else if(this.currentPosition===0 || this.currentPosition>this.editObject.viewObj.current_length){
                msg='计米器读数超出布匹长度范围！';
                className='warning';
            }else{
                msg='是否确定在当前位置 <strong>'+ this.currentPosition +'</strong>米 进行分裁操作？';
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
                        if (buttonType === 'sure') vu.doCut();
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
        doCut: function(){
            var sendId=this.editObject.viewObj.bolt_id;
            ajax.send({
                url: PATH.missionCutQuick,
                method: 'post',
                data:{bolt_id: sendId, length: vu.currentPosition},
                success:function(data){
                    dialog.close('loading');
                    //vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    vu._setDetailsData(data,'');
                    //自动打印标签
                    vu.printDoing('end');
                    dialog.open('resultShow',{content:'当前布匹的分裁操作已成功！'});
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
                this.input.start=this.currentPosition===''? 0: this.currentPosition;  //notice
                this.positionCallBack=function(newVal){
                    this.input.start=newVal;
                };
            }else{   //删除疵点操作
                dialog.open('information',{
                    content:'是否确定删除当前疵点？',
                    cname:'sure',
                    btncancel:'',
                    btnsure:'确定',
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
                data:{bolt_id: vu.editObject.viewObj.bolt_id, defects:[vu.input.start+","+vu.input.end]},  //notice
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
                    dialog.open('information',{content:'疵点已经成功删除！',btncancel:'',btnclose:'',btnsure:'确定',cname:'ok'});
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
                console.log(printStr);
                EQUIPMENT.print(printStr);
            }
        },
        //打印历史记录的标签
        printDoginHistory: function(dataObject,opsition){
            var printStr;
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
                printStr=dataObject.print_data;
            }
            printStr=JSON.stringify(printStr);
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
                btncancel:'',
                btnsure:'确定',
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
                temp2='   $id$';
                temp1=temp1.replace('$kind$',this.getPrintList[i].product_code);
                temp2=temp2.replace('$id$',this.getPrintList[i].bolt_no);
                temp1=temp1.replace('$store$',this.getPrintList[i].position.join(','));
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
            console.log(printStr);
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
        'input.step': function(newVal){
            this.input.status='';
            this.input.msg='';
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
        dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
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
    if (vu.UI.view==='mission'){
        vu.getList();
    }else if(vu.UI.view==='record'){
        vu.getRecordList();
    }
    vu.getBookList();

    function fitUI(){
        var H=body.height();
        vu.UI.listHeight=H-154;
        vu.UI.bottomHeight=H-315;
    }
});