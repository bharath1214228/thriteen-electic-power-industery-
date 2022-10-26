/**
 * Use apps api to log analytics data
 */

var http_protocol = window.location.protocol == 'https:' ? 'https' : 'http';

var apps_core = http_protocol+'://apps.decisionbriefs.com/';
var api_endpoint;
var core_track_endpoint;

//Load the apps_core environment specific constant
//jQuery.getScript(
//	'../../environment.js',
//	function(){
		api_endpoint = apps_core+'bigquery/track/actions';
		core_track_endpoint = apps_core+'bigquery/track/core_actions';
//	}
//);

//path data
var t_domain = window.location.host;
var t_url = window.location.href;

//identity data
var t_identity_ip;
var t_identity_id;
var t_session_id;
var t_hash_email;

//application data
var t_application_id;
var t_brand_id;
var t_market;
var t_profiles_collection;

//meta
var t_meta = {};

var t_content_clicks_init = false;
var t_view_logged = false;
var t_search_url = '/search'; //Don't ask.. CM has this set to '/'..

var t_actions = {
	'shared':{},
	'eventdata':[]
};

function t_set_identity_info(ip, id, session_id, hash_email){
	t_identity_ip = ip;
	t_identity_id = id;
	t_session_id = session_id;
	t_hash_email = hash_email;
}

function t_set_app_info(app_id, brand_id, market, profiles_collection){
	t_application_id = app_id;
	t_brand_id = brand_id;
	t_market = market;
	t_profiles_collection = profiles_collection;
}

function getViewport() {
	 var viewPortWidth;
	 var viewPortHeight;
	
	 // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
	 if (typeof window.innerWidth != 'undefined') {
	   viewPortWidth = window.innerWidth,
	   viewPortHeight = window.innerHeight;
	 }
	
	// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
	 else if (typeof document.documentElement != 'undefined'
	 && typeof document.documentElement.clientWidth !=
	 'undefined' && document.documentElement.clientWidth != 0) {
	    viewPortWidth = document.documentElement.clientWidth,
	    viewPortHeight = document.documentElement.clientHeight;
	 }
	
	 // older versions of IE
	 else {
	   viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
	   viewPortHeight = document.getElementsByTagName('body')[0].clientHeight;
	 }
	 return [viewPortWidth, viewPortHeight];
}

function t_generate_shared_meta(){
	jQuery.getScript(
		apps_core+'js/plugins/json2.js', //ie is stoopid
		function(){
			jQuery.getScript(
				apps_core+'js/plugins/wurfl.js',
				function(){
					jQuery.getScript(
						apps_core+'js/plugins/browser.js',
						function(){
							var browser = JSON.parse(JSON.stringify(bowser, null, '    '));
							var viewport = getViewport();
		
							t_meta.visitor = {
								resolution: viewport[0]+'x'+viewport[1],
								os: window.navigator.platform,
								'browser': browser.name,
								language: window.navigator.language,
								device_type: WURFL.form_factor
							};
						}
					);
				}
			);
		}
	);
}

/**
 * TODO: when we have the distribution model set up, we can just pass in:
 * action, widget and distribution id (have DB apps figure out the rest)
 * campaign id, meta and value are optional
 * 
 * for now we have to do a reverse lookup for distribution id..
 * based on (entity_id, entity_collection, channel)
 * from there we can determine owner as well
 * 
 * Down the line, all we need is
 * -action 
 * -distribution_id
 * -widget
 *
 * Prepare Actions to be sent to the Tracking API
 */
function t_log_action(
	action, 
	entity_id, 
	entity_collection, 
	owner,
	distribution_id,
	channel,
	widget,
	campaign_id,
	meta,
	value
){
	if(action == 'view'){
		t_view_logged = true;
	}
	
	if(meta == null){
		meta = {};
	}
	
	meta.referrer = document.referrer;
	meta.title = document.title;
	
	t_actions.eventdata.push({
		'action':action,
		'entity_id':entity_id,
		'entity_collection':entity_collection,
		'owner':owner,
		'distribution_id':distribution_id,
		'channel':channel,
		'widget':widget,
		'campaign_id':campaign_id,
		'meta':meta,
		'value':value
	});
	
	if(t_content_clicks_init == false && action == 'view'){
		buyersguide_init_track_content_clicks(
			entity_id,
			entity_collection
		);
		
		t_content_clicks_init = true;
	}
}

function t_log_actions(){
	//reset the endpoint to prevent cancelled calls
	var curTime = new Date().getTime();
	jQuery('#core_tracking_form').attr('action',core_track_endpoint+'/crts_'+curTime);
	
	if(!t_view_logged){
		//just log the page view
		t_log_action(
			'view', //action 
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null
		);
	}
	
	t_actions.shared = {
		'identity_ip':t_identity_ip,
		'identity_id':t_identity_id,
		'session_id':t_session_id,
		'hash_email':t_hash_email,
		'application_id':t_application_id,
		'brand_id':t_brand_id,
		'market':t_market,
		'url':window.location.href,
		'meta':t_meta
	};

	//append actions json to our iframe form and post the form to the iframe
	jQuery('#tracking_json').val(JSON.stringify(t_actions));
	jQuery('#core_tracking_form').submit();
	t_actions.eventdata = [];
	
	/*
	jQuery.ajax({
		type: "POST",
		url: api_endpoint,
		async: t_actions.eventdata.length > 1 ? true : false, //only important for single actions (clicks)
		data: t_actions,
	}).done(function(){
		t_actions.eventdata = [];
		return true;
	});
	*/
}

function wp_gated_init_track_downloads(
	instance_entity,
	instance_collection
){
	jQuery(document).ready(function(){
		jQuery('div#gated-content a').each(function(){
			var anchor = jQuery(this);
			if(anchor.attr('href') == '#') return;
			
			jQuery(this).click(function(e){
				e.preventDefault();
                                e.stopPropagation();
			
				t_log_action(
					'download',
					instance_entity,
					instance_collection,
					'', //owner
					null,
					'', //channel
					'', //widget
					null,
					null,
					null
				);

				t_log_actions();

				window.open(anchor.attr('href'),'_blank');
			});
		});
	});
}

function buyersguide_init_track_content_clicks(
	instance_entity,
	instance_collection
){
	if(window.location.href.indexOf('/content/') == -1 && window.location.href.indexOf('/article/') == -1){
		return;
	}
	
	jQuery(document).ready(function(){
		//don't track .ai_download; already handled via another handler...causing mulitple windows to open on these links 
		jQuery('div#content.bq_trackable a, #db-content-content a').not('.ai_download').each(function(){
			var anchor = jQuery(this);
			if(anchor.hasClass('carousel-control')) return;
			if(anchor.hasClass('pagination')) return;
			if(anchor.attr('href') == '#') return;
			
			jQuery(this).click(function(e){
				e.preventDefault();
                                e.stopPropagation();
				
				var href = window.location.href;
				href = href.replace(/^(?:\/\/|[^\/]+)*\//, ""); //remove protocol and domain
				
				if(href.substring(0,1) == '/'){
					var href = href.substring(1); //remove first '/'
				}
				
				var parts = href.split('/');
				var owner = parts[0];
				
				var meta = {
					'text' : anchor.html(),
					'target_url' : anchor.attr('href'),
					'source' : {
						'entity_id' : instance_entity,
						'entity_collection' : instance_collection,
					}
				};
				
				//manually log the action.. we have to set the owner group manually
				t_actions.eventdata.push({
					'action':'link_click',
					'owner':owner,
					'meta':meta,
				});
				
				t_log_actions();
				window.open(anchor.attr('href'),'_blank');
			});
		});
	});
}

jQuery(document).ready(function(){
	t_generate_shared_meta();
	
	window.setTimeout(function(){
	
	//create the form and iframe we will be using to send tracking data to the core
	//jQuery('<iframe />').appendTo('body').attr({'id':'core_tracking','name':'core_tracking','style':'display:none;'});
	
	//Not sure why - but sometimes this iframe shows up twice..
	if(document.getElementById('core_tracking') == null){	
		var iframe;
		try {
		  iframe = document.createElement('<iframe name="core_tracking">');
		} catch (ex) {
		  iframe = document.createElement('iframe');
		}
		
		iframe.id = 'core_tracking';
		iframe.name = 'core_tracking';
		iframe.width = 0;
		iframe.height = 0;
		iframe.marginHeight = 0;
		iframe.marginWidth = 0;
		iframe.setAttribute('style',"display:none;");
		
		var objBody = document.getElementsByTagName("body").item(0);
		objBody.insertBefore(iframe, objBody.firstChild);
		
		var curTime = new Date().getTime();
		jQuery('body').append('<form action="'+core_track_endpoint+'/crts_'+curTime+'" method="post" id="core_tracking_form" target="core_tracking"></form>');
		jQuery('#core_tracking_form').append('<input type="hidden" name="json" id="tracking_json" value="{}" />');
	}

	jQuery('div.bq_trackable').each(function(){
		var widget_name = jQuery(this).attr('id');
		var channel = jQuery('.d_channel',jQuery(this)).first().attr('id');

		jQuery('a',jQuery(this)).each(function(){
			var href = jQuery(this).attr('href');

			if(href == undefined){
				return;
			}

			if(href.indexOf('http://') === 0){
				href = href.replace(/^(?:\/\/|[^\/]+)*\//, "");
			}
			
			if(href.substring(0,1) == '/'){
				var href = href.substring(1); //remove first '/'
			}
			
			var parts = href.split('/');
			var entity_id;
			var entity_collection;
			var owner = parts[0];
			
			//get the collection name
			if(parts.length == 1){
				entity_id = parts[0];
				entity_collection = t_profiles_collection;
			} else {
				entity_id = parts[2];
				entity_collection = parts[1];
			}
			
			entity_id = jQuery(this).attr('data-entity-id');

			//Impressions
			if(jQuery(this).hasClass('t_read')){
				t_log_action(
					'impression',
					entity_id,
					entity_collection,
					owner,
					null,
					channel,
					widget_name,
					null,
					null,
					null
				);
			}

			var anchor = jQuery(this);
			if(!jQuery(this).hasClass('ai_download') && anchor.attr('href').indexOf('http://') !== -1){
				return;
			}
			
			if(anchor.hasClass('carousel-control')) return;
			if(anchor.hasClass('pagination')) return;
			if(anchor.attr('href') == '#') return;
			
			jQuery(this).click(function(e){
				e.preventDefault();
                                e.stopPropagation();
				var action = 'click';
				var instance_owner = owner;
				var instance_entity = jQuery(this).attr('data-entity-id');//entity_id;
				var instance_collection = entity_collection;
				
				if(jQuery(this).hasClass('ai_download')){
					action = 'download';
					var window_href = window.location.href;
					if(window_href.indexOf('http://') === 0){
						window_href = window_href.replace(/^(?:\/\/|[^\/]+)*\//, "");
					}
					
					if(window_href.substring(0,1) == '/'){
						var window_href = window_href.substring(1); //remove first '/'
					}
					
					var window_parts = window_href.split('/');
					instance_owner = window_parts[0];

					if(window_parts.length == 1){
						instance_entity = window_parts[0];
						instance_collection = t_profiles_collection;
					} else {
						instance_entity = window_parts[2];
						instance_collection = window_parts[1];
					}
				}
				
				t_log_action(
					action,
					instance_entity,
					instance_collection,
					instance_owner,
					null,
					channel,
					widget_name,
					null,
					null,
					null
				);

				t_log_actions();
				if(action == 'download'){
					window.open(anchor.attr('href'),'_blank');
				} else {
					window.location.href = anchor.attr('href');
				}
			});
		});
	});

	jQuery.getScript(
		apps_core+'js/custom/bigquery/md5.js',
		function(){
			jQuery.getScript(
				apps_core+'js/custom/bigquery/cookies.js', 
				function(){
					email_vaccum_init();
					//t_hash_email = core_getCookie('_h3');
					//core_initAppsCookie();
					t_log_actions();
				}
			);
		}
	);
	
	//Now for search tracking (the url will be document.referrer in this case - so we have to send a custom request)
	if(window.location.href.indexOf(t_search_url) > -1){
		var search_string = '';
		var q_param = t_getParameterByName('q');
		var s_param = t_getParameterByName('s');
		
		if(q_param != ''){
			search_string = q_param;
		} else if(s_param != ''){
			search_string = s_param;
		}
		
		if(search_string != ''){
			t_log_action(
				'search', //action 
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				{
					'keyword':search_string
				},
				null
			);
			
			t_actions.shared = {
				'identity_ip':t_identity_ip,
				'identity_id':t_identity_id,
				'session_id':t_session_id,
				'hash_email':t_hash_email,
				'application_id':t_application_id,
				'brand_id':t_brand_id,
				'market':t_market,
				'url':document.referrer,
				'meta':t_meta
			};
		
			//append actions json to our iframe form and post the form to the iframe
			jQuery('#tracking_json').val(JSON.stringify(t_actions));
			jQuery('#core_tracking_form').submit();
			t_actions.eventdata = [];
		}
	}
	
	},300);
});

//there could be another function with this name.. prefix it with t_ as well
function t_getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
