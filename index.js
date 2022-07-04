const railMap = new RailMap();
let stationsPanel, linesPanel, stationOnLinePanel;
/*
Test Command
railMap.stations.push(new StationObject("1",100,100))
railMap.stations.push(new StationObject("2",200,600))
railMap.stations.push(new StationObject("3",400,100))
let line=new LineObject("1",'#ff0000')
line.stations.push(railMap.stations[0])
line.stations.push(railMap.stations[1])
line.stations.push(railMap.stations[2])
railMap.lines.push(line)

railMap.Render(document.getElementById('map'),false,true,undefined)
 */
window.onload = () => {
    window.onresize();
    stationsPanel = document.getElementById('stations');
    linesPanel = document.getElementById('lines');
    stationOnLinePanel = document.getElementById('stationsOnLine');
    //画布ID，点的数量，点的颜色RGB，线的颜色RGB，连线大小（0为动态大小，占用资源），点之间连线的距离，
    //与鼠标连线的距离，禁止点连线的个数，X轴移动系数>=2，Y轴移动系数>=2，
    //连线阴影颜色（留空为不启用，若开启占用资源），连线阴影大小系数
    Pranule(['','100',"0.0.160","0,255,255",'0','6000','20000','0','2','2','','0']);
};
window.onresize = () => {
    var map = document.getElementById('mapBorder');
    map.style.width = `${window.innerWidth - map.style.left.replace('px', '') - 10}px`;
    map.style.height = `${window.innerHeight - map.style.top.replace('px', '') - 10}px`;
};
const ReloadData = (map, station, line, stationOnLine) => {
    if (map == true) railMap.Render(document.getElementById('map'), false, true, undefined);
    if (station == true) {
        const selectedIndex = stationsPanel.options.selectedIndex;
        if (railMap.stations.length == 0) stationsPanel.innerHTML = '<option>没有站点</option>';
        else stationsPanel.innerHTML = railMap.stations.reduce((p, c) => p + `<option>${c.name}</option>`, '');
        stationsPanel.selectedIndex = selectedIndex >= railMap.stations.length ? selectedIndex - 1 : selectedIndex;
    }
    if (line == true) {
        const selectedIndex = linesPanel.options.selectedIndex;
        if (railMap.lines.length == 0) linesPanel.innerHTML = '<option>没有线路</option>';
        else linesPanel.innerHTML = railMap.lines.reduce((p, c) => p + `<option>${c.name}</option>`, '');
        linesPanel.selectedIndex = selectedIndex >= railMap.stations.length ? selectedIndex - 1 : selectedIndex;
    }
    if (stationOnLine == true) {
        if (document.getElementById('lines').value == undefined) stationOnLinePanel.innerHTML = '<option>未选择线路</option>';
        else {
            const selectedIndex = stationOnLinePanel.options.selectedIndex;
            let line = railMap.lines.find(x => x.name == document.getElementById('lines').value);
            if (line == undefined) return;
            if (line.stations.length == 0) stationOnLinePanel.innerHTML = '<option>没有站点</option>';
            else stationOnLinePanel.innerHTML = line.stations.reduce((p, c) => p + `<option>${c.name}</option>`, '');
            stationOnLinePanel.selectedIndex = selectedIndex >= railMap.stations.length ? selectedIndex - 1 : selectedIndex;
        }
    }
}
const AddStation = () => {
    let dialog = new Dialog('添加站点');
    dialog.AddContext('name', '站点名称');
    dialog.AddContext('x', 'X坐标');
    dialog.AddContext('y', 'Y坐标');
    dialog.ShowDialog(result => {
        let name = result.find(x => x.id == 'name').value;
        let x = result.find(x => x.id == 'x').value;
        let y = result.find(x => x.id == 'y').value;
        railMap.stations.push(new StationObject(name, x, y));
        ReloadData(true, true, false, false);
    });
}
const AddLine = () => {
    let dialog = new Dialog('添加线路');
    dialog.AddContext('name', '线路名称');
    dialog.AddContext('color', '线路颜色', undefined, 'color');
    dialog.ShowDialog(result => {
        let name = result.find(x => x.id == 'name').value;
        let color = result.find(x => x.id == 'color').value;
        railMap.lines.push(new LineObject(name, color));
        ReloadData(false, false, true, false);
    });
}
const AddStationToLine = () => {
    if (stationsPanel.options.selectedIndex == -1 || linesPanel.options.selectedIndex == -1) return;
    railMap.lines[linesPanel.options.selectedIndex].stations.push(railMap.stations[stationsPanel.options.selectedIndex]);
    ReloadData(true, false, false, true);
}
const ModifyStation = () => {
    const selectedIndex = stationsPanel.options.selectedIndex;
    if (selectedIndex == -1) return;
    let dialog = new Dialog("修改站点信息");
    dialog.AddContext('name', '站点名称', station.name);
    dialog.AddContext('x', 'X坐标', station.location.X);
    dialog.AddContext('y', 'Y坐标', station.location.Y);
    dialog.ShowDialog(result => {
        railMap.stations[selectedIndex].name = result.find(x => x.id == 'name').value;
        railMap.stations[selectedIndex].location.X = result.find(x => x.id == 'x').value;
        railMap.stations[selectedIndex].location.Y = result.find(x => x.id == 'y').value;
        ReloadData(true, true, false, true);
    });
}
const ModifyLine = () => {
    if (linesPanel.options.selectedIndex == -1) return;
    const line = railMap.lines[linesPanel.options.selectedIndex];
    let dialog = new Dialog('修改线路信息');
    dialog.AddContext('name', '线路名称', line.name);
    dialog.AddContext('color', '线路颜色', line.color, 'color');
    dialog.ShowDialog(result => {
        line.name = result.find(x => x.id == 'name').value;
        line.color = result.find(x => x.id == 'color').value;
        ReloadData(true, false, true, false);
    });
}
const DelStation = () => {
    if (stationsPanel.options.selectedIndex == -1) return;
    const stationIndex = stationsPanel.options.selectedIndex;
    let dialog = new Dialog("确定要删除此站点吗？");
    dialog.ShowDialog(() => {
        for (let line in railMap.lines) {
            line.stations.remove(stationIndex);
            for (let i = 0; i < line.stations.length; i++)
                if (line.stations[i] > stationIndex)
                    line.stations[i]--;
        }
        railMap.stations.splice(stationIndex, 1);
        ReloadData(true, true, false, true);
    })
}
const DelLine = () => {
    if (linesPanel.selectedIndex == -1) return;
    const line = railMap.lines[linesPanel.selectedIndex];
    let dialog = new Dialog("确定要删除此线路吗？");
    dialog.ShowDialog(() => {
        railMap.lines.remove(line);
        ReloadData(true, false, true, true);
    })
}
const MoveUp = () => {
    if (linesPanel.selectedIndex == -1) return;
    const line = railMap.lines[linesPanel.selectedIndex];
    const stationIndexOnLine = stationOnLinePanel.options.selectedIndex;
    if (stationIndexOnLine == 0 || stationIndexOnLine == -1) return;
    swapItems(line.stations, stationIndexOnLine - 1, stationIndexOnLine);
    ReloadData(true, false, false, true);
}
const MoveDown = () => {
    if (linesPanel.selectedIndex == -1) return;
    const line = railMap.lines[linesPanel.selectedIndex];
    const stationIndexOnLine = stationOnLinePanel.options.selectedIndex;
    if (stationIndexOnLine == line.stations.length - 1 || stationIndexOnLine == -1) return;
    swapItems(line.stations, stationIndexOnLine, stationIndexOnLine + 1);
    ReloadData(true, false, false, true);
}
const DelStopFromLine = () => {
    const line = railMap.lines.find(x => x.name = linesPanel.value);
    line.stations.splice(stationOnLinePanel.options.selectedIndex, 1);
    ReloadData(true, false, false, true);
}
const SplitLine = () => {
    //TODO
}