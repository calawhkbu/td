/**
 * Get Route_list uri 
 * @param {string} mode 
 * return string
 */
async function route_list_uri(mode, type = 'route_list') {
    let data = await $.getJSON('api.json')
    return data.find(o => o.mode == mode && o.type == type) &&
        data.find(o => o.mode == mode && o.type == type).uri
}


async function api_filter_route(uri, rte) {
    let { data: data } = await $.getJSON(uri)
    return data.filter(o => o.route == rte)
}

async function api_get_stops(mode, uri, route, direction) {
    let result = []
    let { data: data } = await $.getJSON(`${uri}/${route}/${direction == 'O' ? 'outbound' : 'inbound'}/1`) //route_list

    let stopUri = await route_list_uri(mode, 'stop_list')
    let etaUri = await route_list_uri(mode, 'eta')
    let route_stop_uri = await route_list_uri(mode, 'route-stop')
    let { data: routes } = await $.getJSON(`${route_stop_uri}/${route}/${direction == 'O' ? 'outbound' : 'inbound'}/1`)

    if (routes.length > 0) {
        for (let i = 0; i < routes.length; i++) {
            let name = await api_get_stops_name(stopUri, routes[i].stop)
            let eta = await api_get_eta(etaUri, routes[i].stop, routes[i].route, direction)
            result.push({
                stop: routes[i].stop,
                name: name.name_en,
                chiName: name.name_tc,
                eta
            })
        }
    }


    return result
}

async function api_get_stops_name(uri, stopId) {
    let { data: data } = await $.getJSON(`${uri}/${stopId}`)
    return data
}

async function api_get_eta(uri, stopId, route, direction) {
    let { data: data } = await $.getJSON(`${uri}/${stopId}`)
    let result = []
    result = data.filter(o => o.route == route && o.dir == direction && o.service_type == 1)
    result = result.map(o => o.eta)

    return result
}


async function showMTRLines() {
    let result = ''
    let data = await $.getJSON('lines.json')

    if (data && data.length > 0) {
        data.forEach((item) => {
            result += `<button class='m-2 line btn btn-outline-secondary' data-line='${item.code}'>${item.name} - (${item.code})</button>`
        })
    }
    return result
}

function init_line() {
    $('.line').click(function (e) {
        line = e.currentTarget.dataset.line
        $('#rteInfo').html(line)
    })
}

async function api_get_mtr_eta(line, sta) {
    let uri = await route_list_uri('mtr', 'eta')
    let result = []
    if (uri) {
        let data = await $.getJSON(uri + `?line=${line}&sta=${sta}`)
        result = data.data[`${line}-${sta}`]
    }

    return result

}

function nextTrainHTML(data) {
    let result = ''
    result += '<tr><td colspan="2"><button class="btn btn-outline-success reload">Reload</button></td></tr>'
    result += '<tr><td colspan="2"><b>UP LINE</b></td></tr>'

    data.UP.forEach((item) => {
        result += `<tr><td>${item.dest} - P${item.plat}</td><td>in ${dayjs(item.time).fromNow()} --${dayjs(item.time).format('HH:mm:ss')} L</td></tr>`
    })

    result += '<td colspan="2"><b>DOWN LINE</b></td>'
    data.DOWN.forEach((item) => {
        result += `<tr>
        <td>${item.dest} - P${item.plat}</td><td>in ${dayjs(item.time).fromNow()} --${dayjs(item.time).format('HH:mm:ss')} L</td>
        </tr>`
    })

    return result
}


async function getGMBRegions() {
    let data = await $.getJSON('gmb.json')
    let html = ''
    if (data.length > 0) {
        data.forEach((item) => {
            html += `<button class='m-2 line btn btn-outline-secondary' data-line='${item.code}'>(${item.code})</button>`
        })
    }
    return html 
}

async function getRouteId(region,route){
    let uri = await route_list_uri('minibus','route_data')
    let {data:data} = await $.getJSON(`${uri}/${region}/${route}`)
    return data && data[0] && data[0].route_id

}

async function getGMBRoutes(routeId,route_seq){
    let uri = await route_list_uri('minibus','route-stop')
    let {data:data} = await $.getJSON(`${uri}/${routeId}/${route_seq}`)
    return data && data.route_stops

}


async function getGMBETA(stopId,routeId,route_seq=1){
    let uri = await route_list_uri('minibus','eta')
    let {data:data} = await $.getJSON(`${uri}/${stopId}`)
    if(data && data.length>0){
        data = data.find(o=>o.route_id==routeId  && o.route_seq==route_seq) &&
        data.find(o=>o.route_id==routeId  && o.route_seq==route_seq).eta &&
        data.find(o=>o.route_id==routeId  && o.route_seq==route_seq).eta.map(o=>o.timestamp)

    }

    return data 


}
async function nextMinibusHTML(data,routeId,route_seq){
    let html =''
    if(!data || data.length==0) html ='NO record.'
    for(let i=0;i<data.length;i++){
        data[i]['eta']=await getGMBETA(data[i]['stop_id'],routeId,route_seq)
    }
    

    if(data && data.length>0){
        data.forEach((item)=>{
            let estimate =''
                if(item.eta && item.eta.length>0){
                    item.eta.forEach((ETA)=>{
                        estimate+=`<li>${dayjs(ETA).fromNow()} -- ${dayjs(ETA).format('HH:mm:ss')}L</li>`
                    })
                }
            html+=`<tr>
            <td>${item.name_en}- ${item.name_tc}</td>
            <td>${estimate}</td>
            </tr>`
        })
    }
    return html 
}