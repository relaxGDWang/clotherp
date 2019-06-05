var vu=new Vue({
    el: '#app',
    data:{
        search:{
            bolt_no: ''
        },
        defectType:[],  //疵点分类
        defect:'',  //当前选择疵点分类
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
            view: 'quick',
            type: 'check',
            dialogShow: false,//标记是否打开了详细对话框
            listHeight: 100,
            bottomListHeight: 100,
            len: 0,
            expand: '',
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
        mission: [],      //入库单列表
        searchResult:[],  //搜索列表
        missionKey:{},    //id与数组索引对应关系
        childrenKey:{},
        editObject: {},
        record: [],       //操作记录数组
        recordKey: {},    //对照表
        recordObject: {}  //操作记录详情
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
            if (itemStr) this.UI.view=itemStr;
            switch(itemStr){
                case 'mission':
                    vu.getList();
                    break;
                case 'record':
                    vu.getRecordList();
                    break;
                case 'quick':
                    setTimeout(function(){
                        vu.$refs.searchInput.focus();
                    },200);
                    break;
                default:
            }
            //关闭详情对话框
            vu.editObject={};
            vu.recordDetails={};
            vu.UI.len='';
            vu.stopEQPosition();
            dialog.close('opDetails');
            vu.UI.dialogShow=false;
            dialog.close('opRecordDetails');
        },
        getViewList: function(){
            if (this.UI.view==='record'){
                this.getRecordList();
            }else if(this.UI.view==='mission'){
                this.getList();
            }
        },
        getList: function(){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.childrenKey={};
            this.flagReload=false;
            ajax.send({
                url: PATH.import,
                data:{},
                success:function(data){
                    dialog.close('loading');
                    //加工列表数据
                    for (var i=0; i<data.length; i++){
                        data[i].children=[];
                        data[i].childrenLoad=false;
                        //加工日期
                        data[i].created_at=data[i].created_at.split(' ');
                        vu.missionKey[data[i].id]=i;
                    }
                    vu.mission=data;
                },
                error:function(code,msg){
                    dialog.close('loading');
                    dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
                }
            });
        },
        getMissionList: function(row, event){  //获得入库单对应的检验任务
            var obj=this.mission[this.missionKey[row.id]];
            if (!obj.childrenLoad) {
                var sendData = {id: obj.id};
                this.flagReload=false;
                ajax.send({
                    url: PATH.importDetails,
                    data: sendData,
                    success: function (data) {
                        dialog.close('loading');
                        obj.childrenLoad = true;
                        obj.children = data.bolts;
                        for (var i=0; i<data.bolts.length; i++){
                            data.bolts[i].position=data.bolts[i].position.split(REG.position);
                            vu.childrenKey[data.bolts[i].bolt_id]=data.bolts[i];
                        }
                        if (vu.UI.expand!==obj){
                            vu.$refs.myTable.toggleRowExpansion(obj);
                            if (vu.UI.expand) vu.$refs.myTable.toggleRowExpansion(vu.UI.expand);
                            vu.UI.expand=obj;
                        }
                    }
                });
            }else{
                if (vu.UI.expand===obj){
                    vu.UI.expand='';
                    vu.$refs.myTable.toggleRowExpansion(obj);
                }else{
                    vu.$refs.myTable.toggleRowExpansion(vu.UI.expand);
                    vu.$refs.myTable.toggleRowExpansion(obj);
                    vu.UI.expand=obj;
                }
            }
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
        //快速检验输入框应对
        changeSearchNumber: function(e){
            var dialogCfg={btncancel:'', btnclose:'', btnsure:'确定'};
            if (e===undefined || e.keyCode===13){
                this.search.bolt_no=this.search.bolt_no.replace(/00\s/,'');
                if (!this.search.bolt_no){
                    dialogCfg.cname='warning';
                    dialogCfg.content='请填写需要查询的布匹卷号！';
                    dialog.open('information',dialogCfg);
                }else{
                    //this.openDetails();
                    this.searchResult=[];
                    if (e) e.target.blur();
                    ajax.send({
                        url: PATH.missionCheck,
                        data: {bolt_no: this.search.bolt_no},
                        success:function(data){
                            dialog.close('loading');
                            data=data.items;
                            if (data.length===0){
                                dialogCfg.cname='sure';
                                dialogCfg.content='没有找到对应的布卷信息';
                                dialog.open('information',dialogCfg);
                            }else{
                                if (data.length===1 && data[0].detail){
                                    //打开详情框
                                    vu.openDetails('','',data[0].detail);
                                }else{
                                    //显示列表
                                    for (var i=0; i<data.length; i++){
                                        data[i].position=data[i].position.split(REG.position);
                                    }
                                    vu.searchResult=data;
                                }
                            }
                        }
                    });
                }
            }
        },
        //打开布卷详情
        openDetails: function(bid, start, getData){
            var dialogConfig={
                closeCallback: function(){
                    vu.editObject={};
                    if (vu.UI.view==='record'){
                        if (vu.flagReload){
                            vu.recordDetails={};
                            dialog.close('opRecordDetails');
                            vu.getRecordList();
                        }else if(vu.record.length===0){
                            vu.getRecordList();
                        }
                    }else if(vu.UI.view==='mission'){
                        //if (vu.flagReload) vu.getList();
                        if (vu.flagReload){
                            if (vu.UI.expand){
                                vu.UI.expand.childrenLoad=false;
                                vu.getMissionList(vu.UI.expand);
                            }
                        }
                        vu.UI.len='';
                        vu.stopEQPosition();
                    }
                    vu.UI.dialogShow=false;
                    //if (vu.UI.view==='quick') setTimeout(function(){vu.$refs.searchInput.focus();},300);
                },
                openCallback: function(){
                    vu.UI.dialogShow=true;
                }
            };

            if (bid){
                ajax.send({
                    url: PATH.missionCheckDetails,
                    data: {bolt_id: bid, start: (start || undefined)},
                    success:function(data){
                        dialog.close('loading');
                        vu._setDetailsData(data,data.bolt_id);
                        vu.startEQPosition();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }else if(getData){
                vu._setDetailsData(getData,getData.bolt_id);
                vu.startEQPosition();
                dialog.open('opDetails',dialogConfig);
            }
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
            for (var i=0; i<data.splits.length; i++){
                data.list[data.splits[i].bolt_id]=i;
            }
            data.position=data.position.split(REG.position);  //加工所在仓位
            //加工日期时间
            if (!data.examined_at){
                data.examined_at=['--'];
            }else{
                data.examined_at=data.examined_at.split(/\s/);
            }
            if (data.examined_at.length===1) data.examined_at[1]='';
            if (!this.childrenKey[data.bolt_id]){
                this.editObject={
                    bolt_id: data.bolt_id,
                    bolt_no: data.bolt_no,
                    product_code: data.product_code,
                    current_length: data.current_length,
                    examine: data.examine,
                    examiner: data.examiner,
                    examined_at: data.examined_at,
                    viewObj: data
                };
                if (data.position.constructor===Array){
                    this.editObject.position=data.position;
                }else{
                    this.editObject.position=data.position.split(REG.position);
                }
            }else{
                Vue.set(this.childrenKey[idStr],'viewObj',data);
                Vue.set(this.childrenKey[idStr],'finished',false);  //标记当前布匹是否完成检验
                if (!flag) Vue.set(this,'editObject',this.childrenKey[idStr]);
            }
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
                data:{bolt_id: vu.editObject.viewObj.bolt_id, qualified: pass, length: nowCurrentPosition},
                success:function(data){
                    vu.flagReload=true;
                    EQUIPMENT.resetCounter(true);
                    vu._setDetailsData(data,'');
                    dialog.close('loading');
                    dialog.open('information', {
                        content: '布匹检验已完成！',
                        btnclose:'',
                        btncancel: '',
                        btnsure:'确定',
                        cname:'ok',
                        closeCallback: function(){
                            if (vu.UI.view==='record'){
                                vu.recordDetails={};
                                dialog.close('opRecordDetails');
                                vu.getRecordList();
                            }else if (vu.UI.view==='mission'){
                                if (vu.UI.expand){
                                    vu.UI.expand.childrenLoad=false;
                                    vu.getMissionList(vu.UI.expand);
                                }
                                //vu.getList();
                            }else if(vu.UI.view==='quick'){
                                vu.changeSearchNumber();
                            }
                            vu.UI.len='';
                            vu.stopEQPosition();
                            vu.editObject={};
                            dialog.close('opDetails');
                            vu.UI.dialogShow=false;
                            if (vu.UI.view==='quick') setTimeout(function(){vu.$refs.searchInput.focus();},300);
                        }
                    });
                    //把当前对象标记为已完成
                    vu.editObject.finished=true;
                    //胚布打印4次末尾标签
                    if (vu.editObject.viewObj.craft_val===1){
                        vu.printDoing('end',4);
                    }else{
                        vu.printDoing('end',2);
                    }
                }
            });
        },
        askCut: function(){
            /*
            var msg,className,doFlag=false;
            if (!this.currentPosition){
                msg='没有准确获得计米器当前的读数！';
                className='warning';
            }else if(this.currentPosition===0){
                msg='计米器读数为0！';
                className='warning';
            }else{
                msg='是否确定在当前位置 <strong>'+ this.currentPosition +'</strong>米 进行疵点分裁操作？';
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
            */
            this.input.start-=0;
            this.input.end-=0;
            if (REG.flaw.test(this.input.end)===false || this.input.end===0){
                this._setMessage({status:'warning',msg:'疵点结束位置填写有误'});
                return;
            }
            if (this.input.end<this.input.start){
                this._setMessage({status:'warning',msg:'疵点结束位置不能小于开始位置，请重新输入'});
                return;
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.init_bolt_id, start:vu.input.start, end:vu.input.end, cut:1},  //notice
                success: function(data){
                    vu._setDetailsData(data,'');
                    vu.flagReload=true;
                    //清零计米
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                    },200);
                    if (vu.input.start===vu.input.end){
                        vu._setMessage({flag:true, status:'ok', msg:'点状疵点裁剪成功。'});
                        //打印信息
                        vu.printDoginHistory(vu.editObject.viewObj.cutouts[0],'',4);
                    }else{
                        vu._setMessage({flag:true, status:'ok', msg:'块状疵点裁剪成功。'});
                    }
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu._resetInputData();
                    },2000);
                }
            });
        },
        doCut: function(){
            /*
            var sendId=this.editObject.viewObj.bolt_id;
            ajax.send({
                url: PATH.missionCutQuick,
                method: 'post',
                data:{bolt_id: sendId, length: vu.currentPosition},
                success:function(data){
                    dialog.close('loading');
                    //vu.flagReload=true;
                    setTimeout(function(){
                        EQUIPMENT.resetCounter(true);
                    },200);
                    vu._setDetailsData(data,'');
                    //自动打印标签
                    vu.printDoginHistory(vu.editObject.viewObj.cutouts[0],'',4);
                    dialog.open('resultShow',{content:'当前布匹的分裁操作已成功！'});
                }
            });
            */
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
            this.defect='';
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
            this.input.start-=0;
            this.input.end-=0;
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
            this.input.start-=0;
            this.input.end-=0;
            if (REG.flaw.test(this.input.end)===false){
                this._setMessage({status:'warning',msg:'疵点结束位置填写有误'});
                return;
            }
            /*
            if (this.input.end>this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'疵点结束位置大于布长，请重新输入'});
                return;
            }
            */
            if (this.input.end<this.input.start){
                this._setMessage({status:'warning',msg:'疵点结束位置不能小于开始位置，请重新输入'});
                return;
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, start:vu.input.start, end:vu.input.end, type:vu.defect},  //notice
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
        printDoing: function(typeStr,count){
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
                EQUIPMENT.print(printStr,count);
            }
        },
        //打印历史记录的标签
        printDoginHistory: function(dataObject,opsition,count){
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
                printStr=dataObject? dataObject.print_data:'';
            }
            printStr=JSON.stringify(printStr);
            console.log(printStr);
            EQUIPMENT.print(printStr,count);
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
        //更新某些服务端不返回具体新对象情况下的打印信息
        refreshPrintLen: function(newLen){
            this.editObject.viewObj.print_head.info.items[1].text='长度：'+newLen;
            this.editObject.viewObj.print_tail.info.items[1].text='长度：'+newLen;
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
        //重新检验
        doRecheck: function(id){
            this.openDetails(id);
        },
        //获得疵点分类
        getDefectType: function(){
            ajaxElse.send();
        }
    },
    beforeMount: function () {
        this.username=USER.name;
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
        dialog.open('information',{
            content:msg,
            cname:'error',
            btncancel:'',
            btnclose:'',
            btnsure:'确定',
            closeCallback: function(id, dialogType, buttonType){
                if (buttonType==='sure' && vu.UI.view==='quick'){
                    vu.$refs.searchInput.focus();
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

    var boltNo=getUrlQuery('bolt_no');
    var boltId=getUrlQuery('bolt_id');

    if (boltNo) vu.UI.view='quick';
    if (boltId) vu.UI.view='record';

    if (vu.UI.view==='mission'){
        vu.getList();
    }else if(vu.UI.view==='record'){
        //是否获得布段编号，是则打开重新检验（详情）对话框，否则加载列表
        if (boltId){
            vu.openDetails(boltId);
        }else{
            vu.getRecordList();
        }
    }else{
        vu.$refs.searchInput.focus();
        //是否获得卷号，是的话则直接打开改卷详细
        if (boltNo){
            vu.search.bolt_no=boltNo;
            vu.changeSearchNumber();
        }
    }

    //获得疵点分类
    vu.getDefectType();

    function fitUI(){
        var H=body.height();
        vu.UI.listHeight=H-154;
        vu.UI.bottomHeight=H-315;
    }
});