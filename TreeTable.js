(function($) {
	$.fn.TreeTable = function(settings) {
		var default_settings = {
			hasTrHead : false,
			treedata : null,
			http_host : null
		};

		var ds = $.extend(default_settings, settings), table_dom = $(this), htmldata = [];

		if(ds.treedata) {
			htmldata = eachNode(ds.treedata, 1).htmldata;
		}

		$(table_dom).append(htmldata);

		$("[name='pjselect']", table_dom).click(function(){
			$("[name='selectpj']").val($(this).val());
			$("[name='remove']").removeAttr("disabled");
		});
		
		$(".expander", table_dom).each(function(){
			var isleaf=$(this).parent().find("[name='isleaf']").val();
			if(isleaf=='true'){
				$(this).click(trigonclick);
			}
		});

		function trigonclick(e) {
			var eTarget = e.target || e.srcElement, 
				tr = $(eTarget).parents("tr"), 
				pid = tr.attr("id") || '';

			if(tr.hasClass("expanded")) {// then *fold*
				tr.removeClass("expanded");
				tr.addClass("collapsed");
				tr.siblings("tr." + pid).hide();
				return;
			} else if(tr.hasClass("collapsed")) {
				tr.removeClass("collapsed").addClass("expanded");
				tr.siblings("tr." + pid).show();
				tr.siblings("tr.collapsed").each(function() {
					tr.siblings("tr." + this.id).not(this).hide();
				});
			}
		}

		function eachNode(node, deep, pidstr) {
			var root={
					'isaccess': node.isaccessable == '1' ? true : false,
					'htmldata':buildTrHtml(node, deep, pidstr)
				};
            //pidstr 全ての上記ノードのid、スベースで分けて保存する。
			pidstr = pidstr || '';
			pidstr += " " + node.projectid;
			if(node.haschildren) {
				var k = 0,              //k表示しないノード数
                    yx = 0,
                    reobj = {},         //再帰の結果
                    nodeshtml = [];     //下位ノードのHTMLデータ
                    
				deep++;
				for(var i = 0; i < node.ChildNodes.length; i++) {
					//再帰的に全ての子ノードを取得
                    reobj= eachNode(node.ChildNodes[i], deep, pidstr);
                    if(!reobj.isaccess){
                        k++;
                    }
                    //ノードのhtmlデータをnodeshtmlに保存する。
                    nodeshtml.push(reobj.htmldata);
				}
                
                //如全部无效
				if( k!=0 && k == node.ChildNodes.length){
					root.htmldata='';
                    return root;
                }
                //部分有效
                else if(k!=0 && k<node.ChildNodes.length){
                    if(!root.isaccess){
                        root.htmldata=buildTrHtml(node,deep-1,pidstr,true)+nodeshtml.join("");
                    }else{
                        root.htmldata+=nodeshtml.join("");
                    }
                    return root;
				}
                //全部有效
                else if(k ==0 ){
                    root.htmldata+=nodeshtml.join("");
                    return root;
                }
                
			} else {
                //子ノードがアクセス権がない場合は、''を戻る
				if(!root.isaccess){
					root.htmldata='';
                }
				return root;
			}
		}
		
		    
        
		function buildTrHtml(obj, deep, pidstr,disabled) {
			var nextPadding = deep * 15,
				htmldata = [], 
				isaccessable = obj.isaccessable == '1' ? true : false,
				trclass = obj.haschildren ? 'expanded' : 'collapsed'; 

			var bgcolorchange = checkEnddate(obj) ? ' style="background:#eaeaea"':'';
            htmldata.push("<tr class='even" + pidstr + " " + trclass + "' id='" + obj.projectid + "'"+bgcolorchange+">");
			if(ds.hasTrHead) {
				htmldata.push("<td style='height: 20px; width: 20px;'><input type='radio' name='pjselect' value='"+obj.projectid+"'/></td>");
			}
			htmldata.push("<td class='name'>");
			htmldata.push("<span class='expander' style='margin-left:" + nextPadding + "px'>&nbsp;</span>");
			if(!isaccessable || disabled){
				htmldata.push("<a href=javascript:alert('アクセス権限がありません。');>");
			}else{
				htmldata.push("<a href='http://" + ds.http_host.split(":")[0] + "/" + obj.template + "/" + obj.accessurl + "' target='_blank'>");
			}
			htmldata.push(obj.projectname);
			htmldata.push("</a>");
			htmldata.push("<input type='hidden' name='projectid' value='" + obj.projectid + "'/>");
			htmldata.push("<input type='hidden' name='isleaf' value='" + obj.haschildren+ "'/>");
			htmldata.push("</td>");
			htmldata.push("<td>");
			htmldata.push(obj.accessurl);
			htmldata.push("</td>");
			htmldata.push("<td>" + obj.template + "</td>");
			htmldata.push("<td>");
			htmldata.push(obj.begindate + "～" + obj.enddate);
			htmldata.push("</td>");
			htmldata.push("<td>");
			htmldata.push(obj.createdate);
			htmldata.push("</td>");
			htmldata.push("<td>");
			htmldata.push(obj.createuser);
			htmldata.push("</td>");
			htmldata.push("</tr>");
			
			return htmldata.join("");
		}
        //获取节点个数 根据权限查询节点个数
        //flag  : true/false
        function getAllChildrensByFlag(node,count,flag){
            if(node.haschildren) {
                if(node.isaccessable==flag){
                    console.debug(node.projectid+"|dd|"+node.projectname);
                    ++count;
                }
                for(var i = 0; i < node.ChildNodes.length; i++) {
                    count=getAllChildrensByFlag(node.ChildNodes[i],count,flag);
                }
                return count;
            } else {
            //console.debug(node.projectid+"|aa|"+node.projectname);
                if(node.isaccessable==flag){
                    console.debug(node.projectid+"|aa|"+node.projectname);
                    ++count;
                }
                return count;
            }
        }
        //获取全部节点个数
       function getAllChildrens(node,count){
            if(node.haschildren) {
                ++count;
                for(var i = 0; i < node.ChildNodes.length; i++) {
                    count=getAllChildrens(node.ChildNodes[i],count);
                }
                return count;
            } else {
                    ++count;
                return count;
            }
        }
        function checkEnddate(obj){
            var today = new Date();
            var mydate = new Date();
            var enddate = obj.enddate;
            adate  = enddate.split("/");
            mydate.setFullYear(adate[0],adate[1]-1,adate[2]);
            if (today > mydate){
                return true;
            }else{
                return false;
            }   
        }

	}
})(jQuery);
