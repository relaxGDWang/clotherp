var PCOUNT=0;
var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: undefined, //默认进行中任务，finished完成的任务
            craft: '',           //成品prod 胚布raw
            book_id: '',         //样本编号
            bolt_no: undefined,  //卷号
            urgent: '',          //是否加急，加急1，否则留空
            craftList:[{key:'prod',label:'成品'},{key:'raw',label:'胚布'}],
            bookList:[]
        },
        cutpage:{
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
            step:1,        //步骤
            readonly: true   //是否自定义输入，否则按计米器数值输入
        },
        getPrintList:[],  //取货打印信息
        printTemplate:'',  //打印模板信息
        editObject: {},
        mission: [],     //任务细分数组，ajax直接返回
        missionKey: {},  //bolt_id与数组index对应关系
        books: []        //样本信息
    },
    computed:{
        isDisabled: function(){
            return this.search.listType || this.editObject.finished;
        },
        isDisabled2: function(){
            return false;
            //return !this.editObject || !this.editObject.viewObj || this.editObject.viewObj.splits.length===0;
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
        getList: function(pageNum){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.flagReload=false;
            if (pageNum) this.cutpage.page=pageNum;
            ajax.send({
                url: PATH.missionCheck,
                data:{status: this.search.listType, urgent: (this.search.urgent || undefined), craft: (this.search.craft || undefined), book_id: (this.search.book_id || undefined), bolt_no: this.search.bolt_no, page: this.cutpage.page},
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
                    dialog.open('information',{content:msg, cname:'error', btncancel:''});
                    vu.cutpage.page=vu.cutpage.page2;
                }
            });
        },
        //分页
        changePage: function(page){
            this.getList(page);
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
        //查询条件变更
        changeSearchRelation: function(){
            this.search.bolt_no='';
            this.getList(1);
        },
        //查询条件中的卷号变更
        changeSearchNumber: function(e){
            if (e.keyCode===13){
                this.search.bolt_no=this.search.bolt_no.replace(/00\s/,'');
                this.search.craft='';
                this.search.book_id='';
                this.getList(1);
                e.target.blur();
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
                    if (vu.search.bolt_no){
                        vu.$refs.numberSearch.focus();
                    }
                }
            };
            /*if (this.missionKey[bid].viewObj!==undefined && start===undefined){
                this.editObject=this.missionKey[bid];
                this._setColthLen();
                this.startEQPosition();
                dialog.open('opDetails',dialogConfig);
            }else{*/
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
            //}
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
        askCut: function(){
            if (this.editObject.viewObj.splits.length>0) {
                //按当前的定位进行提示文本和提示框的协调
                var cutLen = this.editObject.viewObj.splits[0].cut_length;
                var p = 0.05, msg, className;
                var checkValueMax = cutLen + p;
                var checkValueMin = cutLen - p;
                if (this.currentPosition && this.currentPosition >= checkValueMin && this.currentPosition <= checkValueMax) {
                    msg = '是否确定在当前疵点位置 <strong>' + cutLen + '</strong>米 进行分裁操作？';
                    className = 'sure';
                } else {
                    msg = '分裁位置与疵点位置 <strong>' + cutLen + '</strong>米 并不匹配，是否依然进行分裁操作？';
                    className = 'warning';
                }
            }else{
                if (this.currentPosition && this.currentPosition>0 && this.currentPosition<=this.editObject.current_length){
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
            dialog.open('information', {
                content: msg,
                cname: className,
                closeCallback: function (id, dialogType, buttonType) {
                    if (buttonType === 'sure') vu.doCut();
                }
            });
        },
        doCut: function(){
            var isQuick=false, sendId;
            if (this.editObject.viewObj.splits.length>0){
                sendId=this.editObject.viewObj.splits[0].bolt_id;
            }else{
                isQuick=true;
                sendId=this.editObject.bolt_id;
            }
            ajax.send({
                url: isQuick? PATH.missionCutQuick: PATH.missionCutFinished,
                method: 'post',
                data:{bolt_id: sendId, length: vu.currentPosition},
                success:function(data){
                    dialog.close('loading');
                    vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    vu._setDetailsData(data,'');
                    //自动打印标签
                    vu.printDoing('end');
                    dialog.open('resultShow',{content:'当前段的分裁操作已成功！'});
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
                console.log(printStr);
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
    vu.getBookList();

    function fitUI(){
        var H=body.height();
        vu.UI.listHeight=H-154;
        vu.UI.bottomHeight=H-315;
    }
});