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
                eta: dayjs(eta).format('YYYY-MM-DD HH:mm:ss'),
                fromNow: dayjs(eta).fromNow()
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
    return data.find(o => o.route == route && o.dir == direction && o.service_type == 1) &&
        data.find(o => o.route == route && o.dir == direction && o.service_type == 1).eta
}