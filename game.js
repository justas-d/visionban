const log = console.log;

const SIZE_X = 20;
const SIZE_Y = 15;

let TILE_SCALE = 10;
const cw = SIZE_X * TILE_SCALE;
const ch = SIZE_Y * TILE_SCALE;

const canvas = document.createElement("canvas");
canvas.width = cw;
canvas.height = ch;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

document.body.appendChild(canvas);

masterVolume = .25;
muted = false;
unitTesting = false;

let prev_time = 0;

let image_names = [
    "guy",
    "wall1",
    "wall2",
    "wall3",
    "wall4",
    "torch1",
    "torch2",
    "torch3",
    "torch4",
    "rock",
    "finish",
];
let images = {};
for(var i=0; i< image_names.length; i++) {
	var image = new Image();
	image.src = image_names[i]+".png";
	images[image_names[i]]=image;
}

let CHAR_AIR = '.';
let CHAR_WALL = '@';
let CHAR_PLAYER = 'p';
let CHAR_TORCH = 't';
let CHAR_ROCK = 'r';
let CHAR_FINISH= 'f';
let CHAR_FINISH_AND_TORCH= '%';

let levels = [

// NOTE(justas): ok
`
....................
....................
..........@.........
........@@t@@.......
.......@@..f@@......
.......@..p..@......
......@t..r..t@.....
.......@.....@......
........@@t@@.......
..........@.........
....................
....................
....................
....................
`,

    // NOTE(justas): meh
`
....................
....................
....................
.....@@@@@@@@@@.....
.....@........@.....
.....@.t......@.....
.....@........@@....
.....@p.......f@....
.....@.r......@@....
.....@........@.....
.....@@@@@@@@@@.....
....................
....................
....................
....................
`,
    // NOTE(justas): okay
`
....................
.........@@@@.......
........@@..@@......
........@...f@......
........@....@......
........@@.@@@......
.........@.@........
........@@.@@.......
........@...@.......
......@@@...@@@.....
......@.......@.....
......@.r.p.t.@.....
......@.......@.....
......@@@@@@@@@.....
....................
`,
    // NOTE(justas): okay
`
....................
....................
....................
....@@@@@@@@@@......
....@...@@.f.@......
....@...@@...@......
....@.r.@@...@......
....@.p......@@@....
....@.r.@@....f@....
....@.t.@@@@@@@@....
....@...@...........
....@@@@@...........
....................
....................
....................
`,
    // NOTE(justas): meh
`
.......@@@@@........
.......@...@........
.......@r.f@........
.......@...@........
.......@...@........
.......@...@........
.......@..t@........
.......@...@........
.......@...@........
.......@t..@........
.......@...@........
.......@fpr@........
.......@...@........
.......@@@@@........
`,

    // NOTE(justas): good
`
....................
...@@@@@@@@@@@@@....
...@.....p.....@....
...@.....t.....@....
...@...@@.@@...@....
...@...rr.rr...@....
...@...fffff...@....
...@....r.@@...@....
...@...@@@@@@@@@....
...@@@@@............
`,

    // NOTE(justas): ok
`
....................
....................
....................
....@@@@@@@@@@......
....@..f@@...@......
....@..@@@pt.@......
....@..@@.rr.@......
....@..@@@.r.@......
....@......f.@......
....@.......@@......
....@.......@@......
....@@@@@@@@@@......
....................
....................
....................
`,
    // NOTE(justas): ok
`
....................
....................
.....@@@@@@.........
.....@....@@@.......
.....@......@.......
.....@.rrrrr@.......
.....@.trrrr@.......
.....@@..fff@.......
......@.pfff@.......
......@..fff@.......
......@@@@@@@.......
..........t.........
....................
....................
....................
`,
    // NOTE(justas): meh
`
....................
....................
.....@@@@@@.........
.....@....@@@.......
.....@..t...@.......
....@@.rrrrr@.......
....@..trrrr@.......
....@.@..fff@.......
....@.@.pfff@.......
....@.@..fff@.......
....@.......@.......
....@@@@@@@@@.......
....................
....................
....................
`,

    // NOTE(justas): meh
`
.................... 
....................
....................
........@@@@@@@@....
........@f@...f@....
...@@@@@@.@....@....
...@......@.t..@....
...@...t@.f..r.@....
...@.r.p..@..r.@....
...@......@....@....
...@@@@@@@@@@@@@....
....................
....................
....................
....................
`,
    // NOTE(justas): meh
`
.................... 
....................
....................
...@@@@@@@@@@@@@@...
...@......@.....@...
...@..r.....@t..@...
...@..r...@..p.f@...
...@....@....t.f@...
...@......@.....@...
...@@@@@@@@@@@@@@...
....................
....................
....................
....................
`,

    // NOTE(justas): ok
`
.................... 
....................
....................
...@@@@@@@@@@@@@@...
...@......@.....@...
...@..r.....@t..@...
...@..r...@..p.f@...
...@......@....f@...
...@......@.....@...
...@....@....t..@...
...@......@.....@...
...@@@@@@@@@@@@@@...
....................
....................
....................
....................
`,



];

let state = {
    layer_torch: [],
    layer_wall: [],
    layer_vision: [],
    layer_rock: [],
    layer_finish: [],
    current_level_index: 0,
    player: {
        pos: [0, 0],
    },
};

let states = [];

function deep_copy_data(obj) {
    if(Array.isArray(obj)) {
        let copy = [];

        for(let key in obj) {
            copy[key] = deep_copy_data(obj[key]);
        }

        return copy;
    }
    else if(typeof(obj) == "object") {
        let copy = {};
        for(let key in obj) {
            copy[key] = deep_copy_data(obj[key]);
        }

        return copy;
    }
    else if(typeof(obj) == "undefined") {
        return undefined;
    }
    else if(typeof(obj) == "boolean") {
        return obj;
    }
    else if(typeof(obj) == "number") {
        return obj;
    }
    else if(typeof(obj) == "string") {
        return obj; // NOTE(justas): strings are immutable
    }
    else {
        log("unknown obj in deep_copy_data", obj);
    }

    return obj;
}

function push_state() {
    states.push(deep_copy_data(state));
}

function pop_state() {
    if(states.length <= 0) {
        return;
    }

    state = states[states.length - 1];
    states.splice(states.length - 1, 1);
}

function load_level(idx) {
    state.current_level_index = idx;
    const l = levels[idx];
    log(idx);

    state.layer_wall = [];
    state.layer_vision = [];
    state.layer_torch = [];
    state.layer_rock = [];
    state.layer_finish = [];

    let x = 0;
    let y = 0;
    for(let i = 0; i < l.length; i += 1) {

        const c = l.charAt(i);

        if(c == '\n') {
            y += 1;
            x = 0;
        }
        else {
            const tile_idx = SIZE_X * y + x;

            if(c == CHAR_AIR) {
            }
            else if(c == CHAR_WALL) {
                state.layer_wall[tile_idx] = 1;
            }
            else if(c == CHAR_TORCH) {
                state.layer_torch[tile_idx] = 1;
            }
            else if(c == CHAR_FINISH_AND_TORCH) {
                state.layer_torch[tile_idx] = 1;
                state.layer_finish[tile_idx] = 1;
            }
            else if(c == CHAR_ROCK) {
                state.layer_rock[tile_idx] = 1;
            }
            else if(c == CHAR_FINISH) {
                state.layer_finish[tile_idx] = 1;
            }
            else if(c == CHAR_PLAYER) {
                state.player.pos[0] = x;
                state.player.pos[1] = y;
            }
            else {
                log("unknown char at", x, y, `"${c}"`);
            }

            x += 1;
        }
    }
}

function try_get_tile_at(layer, p) {
    const idx = SIZE_X * p[1] + p[0];
    return layer[idx];
}

function remove_tile(layer, p) {
    const idx = SIZE_X * p[1] + p[0];
    layer[idx] = 0;
    return true;
}

function set_tile(layer, p, t) {
    const idx = SIZE_X * p[1] + p[0];
    layer[idx] = t;
    return true;
}

function is_visible_at(p) {
    const idx = SIZE_X * p[1] + p[0];

    if(state.layer_vision.length <= idx) {
        return false;
    }

    return state.layer_vision[idx] > 0;
}

load_level(0);

let animation_time = 0;
let framerate = 10;
let prev_frame_idx = 0;


function update() {
    state.layer_vision = [];
    prev_frame_idx = -1;

    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const idx = SIZE_X * y + x;
            state.layer_vision[idx] = 0;
        }
    }

    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {

            const idx = SIZE_X * y + x;

            if(try_get_tile_at(state.layer_torch, [x,y])) {
                const RADIUS = 2;

                for(let y_off = -2; y_off <= RADIUS; y_off += 1) {
                    for(let x_off = -2; x_off <= RADIUS; x_off += 1) {

                        const local_idx = ((y + y_off) * SIZE_X) + (x + x_off);
                        state.layer_vision[local_idx] = 1;
                    }
                }
            }
        }
    }

    {
        let matching = 0;
        let matching_visible = 0;
        let rock_count = 0;
        let finish_count = 0;

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x,y];

                const rock = try_get_tile_at(state.layer_rock, p);
                const finish = try_get_tile_at(state.layer_finish, p);

                if(rock) {
                    rock_count += 1;
                }
                if(finish) {
                    finish_count += 1;
                }

                if(rock && finish) {
                    if(is_visible_at(p)) {
                        matching_visible += 1;
                    }
                    matching += 1;
                }
            }
        }

        if(matching != 0 && matching >= finish_count && matching_visible == matching) {
            const next_level = (state.current_level_index + 1) % levels.length;
            if(next_level == 0) {
                alert("winrar!");
            }

            load_level(next_level);
            update();
            return;
        }
    }

}

function redraw(time) {
    let dt = (time - prev_time) / 1000;

    if(prev_time === 0) {
        dt = 1/60;
    }

    prev_time = time;

    animation_time = time / 1000;

    let frame_idx = Math.floor(time / (1000 / framerate));

    if(prev_frame_idx == frame_idx) {
        requestAnimationFrame(redraw);
        return;
    }

    prev_frame_idx = frame_idx;

    const blit_img= (img, x, y, sx = 1, sy = 1, r = 0) => {
        if(!img) {
            return;
        }
        ctx.save();

        ctx.translate(x * TILE_SCALE, y * TILE_SCALE);

        if(r != 0) {
            ctx.translate(sx * .5, sy * .5);
            ctx.rotate(r);
            ctx.translate(-sx * .5, -sy * .5);
        }

        ctx.scale(sx, sy);

        ctx.drawImage(img, 0, 0);

        ctx.restore();
    };

    const blit_anim = (img_name, speed, count, x, y, sx = 1, sy = 1, r = 0) => {
        const idx = 1 + Math.floor((animation_time / speed) % count);
        const img = images[img_name + String(idx)];
        blit_img(img, x, y, sx, sy, r);
    };

    const blit_text = (style, txt, x, y) => {
        ctx.font = '32px m6x11';
        ctx.fillStyle = style;
        ctx.fillText(txt, x, y);
    };

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#23262d";
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();

    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x,y];

            if(!is_visible_at(p)) {
                ctx.globalAlpha = .2;
            }
            else {
                ctx.globalAlpha = 1;
            }

            if(try_get_tile_at(state.layer_wall, p)) {
                let idx = 1 + ((x + y) % 4);
                blit_img(images["wall" + String(idx)], x, y);
            }
            if(try_get_tile_at(state.layer_finish, p)) {
                blit_img(images["finish"], x, y);
            }
            if(try_get_tile_at(state.layer_torch, p)) {
                blit_anim("torch", .1, 4, x, y);
            }
            if(try_get_tile_at(state.layer_rock, p)) {
                blit_img(images["rock"], x, y);
            }
        }
    }

    if(!is_visible_at(state.player.pos)) {
        ctx.globalAlpha = .2;
    }
    else {
        ctx.globalAlpha = 1;
    }

    blit_img(images["guy"], state.player.pos[0], state.player.pos[1]);

    ctx.globalAlpha = 1;

    ctx.restore();

    requestAnimationFrame(redraw);
}

function is_solid_at(p) {
    return false;
}

function try_push(pos, delta) {
    const layers = [
        state.layer_torch,
        state.layer_rock
    ];

    const new_pos = vec_add(pos, delta);

    for(const layer of layers) {

        const tile = try_get_tile_at(layer, pos);
        
        if(tile) {
            if(!is_visible_at(new_pos)) {
                return false;
            }

            if(try_get_tile_at(state.layer_wall, new_pos)) {
                return false;
            }

            if(!try_push(new_pos, delta)) {
                return false;
            }

            remove_tile(layer, pos);
            set_tile(layer, new_pos, tile);

            return true;
        }
    }

    return true;
}

function try_walk_guy(delta) {
    const old_state = deep_copy_data(state);

    const new_pos = vec_add(state.player.pos, delta);

    if(!is_visible_at(state.player.pos)) {
        return;
    }

    if(!is_visible_at(new_pos)) {
        return;
    }

    if(try_get_tile_at(state.layer_wall, new_pos)) {
        return;
    }

    if(try_push(new_pos, delta)) {
        states.push(old_state);
        state.player.pos = new_pos;
    }

    update();
}

function update_key(e, is_down) {
    let ret = true;

    if(e.key == "w" || e.key == "W" || e.key == "ArrowUp") {
        if(is_down) try_walk_guy([0, -1]);
        ret = false;
    }

    if(e.key == "s" || e.key == "S" || e.key == "ArrowDown") {
        if(is_down) try_walk_guy([0, 1]);
        ret = false;
    }

    if(e.key == "a" || e.key == "A" || e.key == "ArrowLeft") {
        if(is_down) try_walk_guy([-1, 0]);
        ret = false;
    }

    if(e.key == "d" || e.key == "D" || e.key == "ArrowRight") {
        if(is_down) try_walk_guy([1, 0]);
        ret = false;
    }

    if(e.key == "r" || e.key == "R") {
        if(is_down) {
            push_state();

            load_level(state.current_level_index);
            update();
        }
        ret = false;
    }

    if(e.key == "z" || e.key == "Z") {
        if(is_down) {
            pop_state();
            update();
        }
        ret = false;
    }

    if(!ret) {
        e.preventDefault();
    }

    return ret;
}

function keyup(e) {
    update_key(e, false);
}

function keydown(e) {
    update_key(e, true);
}

function reset_game() {
}

function on_pointer_up(e) {
}

document.body.addEventListener("keyup",keyup);
document.body.addEventListener("keydown",keydown);
document.body.addEventListener("pointerup",on_pointer_up);

update();
requestAnimationFrame(redraw);
