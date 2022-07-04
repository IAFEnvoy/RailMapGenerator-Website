/**
 * RailMap.js
 * @author IAFEnvoy
 * @version 1.0.0
 * @license GPL 3.0
 * @link https://www.gnu.org/licenses/gpl-3.0z.en.html
 * @see
 */
const RailMapJavaScriptVersion = "1.0.0";
class RailMap {
    constructor() {
        this.stations = new Array();
        this.lines = new Array();
    }
    Render(canvas, showStopName, showGrid, font) {
        //Check all stops' line count in 8 directions
        this.stations.forEach(station => station.ClearCnt());
        this.lines.forEach(line => {
            if (line.stations.length <= 1) return;
            line.stations.reduce((p, c, i, arr) => {
                if (i == 0) return p;
                let dirPair = Direction.GetDirectionPair(arr[i - 1], c, p);
                arr[i - 1].lineCnt[dirPair.first.id]++;
                c.lineCnt[Direction.Reverse(dirPair.second).id]++;
                return dirPair.second;
            }, EmptyDirection);
        });
        this.stations.forEach(station => station.AnalyzeTextLocation());
        canvas.width = this.stations.reduce((p, c) => Math.max(p, c.location.X), 0) + 100;
        canvas.height = this.stations.reduce((p, c) => Math.max(p, c.location.Y), 0) + 100;
        //Draw background web
        let ctx = canvas.getContext('2d');
        canvas.height = canvas.height;//clean the canvas
        if (showGrid == true) {
            for (var i = 0; i < canvas.width; i += 100)
                DrawLine(ctx, MakePoint(i, 0), MakePoint(i, canvas.height), '#cccccc');
            for (var i = 0; i < canvas.height; i += 100)
                DrawLine(ctx, MakePoint(0, i), MakePoint(canvas.width, i), '#cccccc');
        }
        //Draw line
        this.lines.forEach(line => {
            //If there is only 1 stop, ignore it
            if (line.stations.length <= 1) return;
            line.stations.reduce((p, c, i, arr) => {
                if (i == 0) return p;
                let dirPair = Direction.GetDirectionPair(arr[i - 1], c, p);
                let d1 = dirPair.first, d2 = dirPair.second;
                let startOffset = arr[i - 1].GetOffset(d1), endOffset = c.GetOffset(Direction.Reverse(d2));
                let startPoint = AddPoint(arr[i - 1].location, startOffset);
                let endPoint = AddPoint(c.location, endOffset);
                if (d1 == d2)
                    DrawLine(ctx, startPoint, endPoint, line.color, 6);
                else {
                    let dis = Math.abs(Math.abs(startPoint.X - endPoint.X) - Math.abs(startPoint.Y - endPoint.Y));
                    let mid = d1.IsMainDirection() ? d1.GetDelta(startPoint, dis, false) : d2.GetDelta(endPoint, dis, true);
                    DrawLines(ctx, new Array(startPoint, mid, endPoint), line.color, 6);
                }
                return d2;
            }, EmptyDirection);
        });
        //Draw Stops
        this.stations.forEach(station => {
            FillCircle(ctx, station.location, 10, '#000000');
            FillCircle(ctx, station.location, 8, '#ffffff');
            if (!showStopName) return;
            let dir = station.textDir;
            let degree = (dir.first.degree + dir.second.degree) / 2 * Math.PI / 180.0;
            let x = Math.cos(degree) * 10 * 2, y = Math.sin(degree) * 10 * 2;
            let size = GetTextSize(station.name, font);
            x -= size.X / 2;
            y -= size.Y / 2;
            DrawString(ctx, station.name, AddPoint(station.location, MakePoint(x, y)), '#000000', font);
        });
    }
}
class LineObject {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.stations = new Array();
    }
}
class StationObject {
    constructor(name, x, y) {
        this.name = name;
        this.location = MakePoint(x, y);
        this.lineCnt = Array.from({ length: 8 }, () => 0);
        this.renderedCnt = Array.from({ length: 8 }, () => 0);
        this.textDir = MakePair(EmptyDirection, EmptyDirection);
    }
    GetOffset(dir) {
        if (this.renderedCnt[dir.id] == this.lineCnt[dir.id])
            throw new RangeError("请求次数过多");
        let totalWidth = (this.lineCnt[dir.id] - 1) * 6;
        let offset = this.renderedCnt[dir.id] * 6 - totalWidth / 2;
        this.renderedCnt[dir.id]++;
        if (dir == Directions[0] || dir == Directions[4])
            return MakePoint(0, offset);
        if (dir == Directions[2] || dir == Directions[6])
            return MakePoint(offset, 0);
        if (dir == Directions[1] || dir == Directions[5])
            return MakePoint(offset * Math.SQRT1_2, -offset * Math.SQRT1_2);
        if (dir == Directions[3] || dir == Directions[7])
            return MakePoint(offset * Math.SQRT1_2, offset * Math.SQRT1_2);
        throw new EvalError("错误的Direction变量，ID为" + dir.id.ToString());
    }
    ClearCnt() {
        this.lineCnt = Array.from({ length: 8 }, () => 0);
        this.renderedCnt = Array.from({ length: 8 }, () => 0);
        this.textDir = MakePair(EmptyDirection, EmptyDirection);
    }
    AnalyzeTextLocation() {
        let check = Array.from({ length: 8 }, () => false);
        let min = Math.min(this.lineCnt);
        for (let i = 0; i < 8; i++)
            check[i] = this.lineCnt[i] - min > 0;
        let maxlen = 0, lennow = 0, dir = null;
        for (let i = 0; i < 16; i++)
            if (check[i % 8] == true) {
                if (lennow >= maxlen) {
                    maxlen = lennow;
                    dir = MakePair((i - lennow) % 8, (i - 1) % 8);
                }
                lennow = 0;
            } else lennow++;
        if (dir == null) dir = MakePair(0, 0);
        let f = dir.first, s = dir.second;
        while (f > s) s += 8;
        while (f < s - 1) { f++; s--; f %= 8; s %= 8; while (f > s) s += 8; }
        this.textDir = MakePair(Directions[f % 8], Directions[s % 8]);
    }
}
class Direction {
    constructor(id, dx, dy, degree) {
        this.id = id;
        this.dx = dx;
        this.dy = dy;
        this.degree = degree;
    }
    IsMainDirection() { return this.dx == 0 || this.dy == 0; }
    GetDelta(point, length, sub) {
        if (sub == true)
            return MakePoint(point.X - length * this.dx, point.Y - length * this.dy);
        return MakePoint(point.X + length * this.dx, point.Y + length * this.dy);
    }
    static Reverse(direction) {
        let id = direction.id;
        id = id - 4 >= 0 ? id - 4 : id + 4;
        return Directions[id];
    }
    static GetDirectionPair(start, end, last) {
        let x = end.location.X - start.location.X;
        let y = end.location.Y - start.location.Y;
        let d = EmptyDirection;
        if (x == 0 && y == 0) return MakePair(last, last);
        else if (x == 0) d = y > 0 ? Directions[2] : Directions[6];
        else if (y == 0) d = x > 0 ? Directions[0] : Directions[4];
        else if (x == y) d = x > 0 ? Directions[1] : Directions[5];
        else if (x == -y) d = x > 0 ? Directions[7] : Directions[3];
        if (d != EmptyDirection) return MakePair(d, d);
        let d1, d2;//direction
        if (x > y) d1 = x + y > 0 ? Directions[0] : Directions[6];
        else d1 = x + y > 0 ? Directions[2] : Directions[4];
        if (x > 0) d2 = y > 0 ? Directions[1] : Directions[7];
        else d2 = y > 0 ? Directions[3] : Directions[5];
        if (last == EmptyDirection) return MakePair(d1, d2);
        let r1 = Math.abs(last.id - d1.id);
        if (r1 > 4) r1 = 8 - r1;
        let r2 = Math.abs(last.id - d2.id);
        if (r2 > 4) r2 = 8 - r2;
        if (r1 > r2) [d2, d1] = [d1, d2];
        if (d1 == Direction.Reverse(last)) [d2, d1] = [d1, d2];
        return MakePair(d1, d2);
    }
}
const Directions = [
    new Direction(0, 1, 0, 0),//Positive X
    new Direction(1, 1, 1, 45),//PXPY
    new Direction(2, 0, 1, 90),//Positive Y
    new Direction(3, -1, 1, 135),//NXPY
    new Direction(4, -1, 0, 180),//Negative X
    new Direction(5, -1, -1, 225),//NXNY
    new Direction(6, 0, -1, 270),//Negative Y
    new Direction(7, 1, -1, 315)//PXNY
];
const EmptyDirection = new Direction(8, 0, 0, 0);
const DrawLine = (ctx, start, end, color, width) => DrawLines(ctx, new Array(start, end), color, width);
const DrawLines = (ctx, points, color, width) => {
    ctx.beginPath();
    ctx.moveTo(points[0].X, points[0].Y);
    for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].X, points[i].Y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}
const FillCircle = (ctx, center, radius, color) => {
    ctx.beginPath();
    ctx.arc(center.X, center.Y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}
const DrawString = (ctx, text, point, color, font) => {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, point.X, point.Y);
}
const GetTextSize = (text, font) => {
    let span = document.createElement("span");
    span.style.font = font;
    span.innerText = text;
    document.body.appendChild(span);
    let size = MakePoint(span.offsetWidth, span.offsetHeight);
    document.body.removeChild(span);
    return size;
}
const AddPoint = (p1, p2) => MakePoint(p1.X + p2.X, p1.Y + p2.Y);
const MakePoint = (X, Y) => ({ X, Y });
const MakePair = (first, second) => ({ first, second });
const swapItems = (a, i, j) => (a[i] && a[j] && [...a.slice(0, i), a[j], ...a.slice(i + 1, j), a[i], ...a.slice(j + 1)]) || a;