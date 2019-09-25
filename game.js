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

masterVolume = 0;
muted = false;
unitTesting = false;
sfxr_has_timeouts = true;

let max_audio_level = 9;
let audio_level = parseInt(localStorage.getItem("audio_level"));
if(Number.isNaN(audio_level)) {
    audio_level = 3;
}

function update_volume(playsnd) {
    audio_level = clamp(audio_level, 0, max_audio_level);
    log(audio_level);

    if(audio_level <= 0) {
        audio_level = 0;
        muted = true;
    }
    else {
        muted = false;
        masterVolume = audio_level / max_audio_level;
    }

    localStorage.setItem("audio_level", audio_level);
    sfxr_clear_cache();

    begin_coroutine(co_fade(1.5, (t) => {
        render_volume_alpha = square01(t);
    }));

    playSound(38453706);
}

update_volume();

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
    "controls",
    "controls2",
];

let images_loaded = {"font": false};

fetch("m6x11.ttf").then(() => {
    images_loaded["font"] = true;
});

let images = {};

for(var i=0; i< image_names.length; i++) {
    images_loaded[image_names[i]] = false;
}
for(var i=0; i< image_names.length; i++) {
	var image = new Image();
    const name = image_names[i];

    const onload = () => {
        images_loaded[name] = true;
    };

    image.onload = onload;
    image.onerror = onload;

	image.src = name + ".png";
	images[name]=image;
}

let CHAR_AIR = '.';
let CHAR_WALL = '@';
let CHAR_PLAYER = 'p';
let CHAR_TORCH = 't';
let CHAR_ROCK = 'r';
let CHAR_FINISH= 'f';
let CHAR_FINISH_AND_TORCH= '%';

let levels = [

`
....................
....................
....................
.........@..........
........@t@.........
....................
.........r..........
.......p...f........
....................
.....@t@...@t@......
......@.....@.......
....................
....................
....................
....................
`,

`
.......@@@@@@@......
.......@@@@@@@......
.......@.@@@.@......
.......@@@t@@@......
...@@.......f.......
...@@.....@.........
........pr...@@@....
.............@@@....
......@@t....@@@....
........@@..........
......@@.@..........
......@....@@.......
.....@@....@@.......
...........@@@......
`,

`
..............@.....
.........@....@.....
.........@....@.....
..............@.....
.@@@@@@@@@@@..@.....
.@......@@@@..@.....
.@.t....@..@..@.....
.@........f@..@@@@..
.@p.....@..@......@.
.@.r.@@@@@@@......@.
.@...@..............
.@@@@....@@@@@@@..@.
....................
....................
....................
`,

`
..........@.........
.........@.@........
........@..f@.......
........@...@.......
........@@.@@.......
........@@.@@.......
........@@.@@.......
........@...@.......
......@@.....@@.....
......@.r.p.t.@.....
......@.......@.....
.......@@@@@@@......
.........@@@........
.........@@@........
`,


    // NOTE(justas): okay
`
.....@...@@...@.....
..........@...@.....
......@@@...........
.....@...@.@@@......
.....@...@@.f.@.....
....@@...@@...@.....
...@.@.r.@@...@.....
...@.@.p......@@....
...@.@.r.@@....f@...
....@@.t.@.@@@@@@...
.....@...@..........
......@@@...........
....................
....................
....................
`,

    // NOTE(justas): ok
`
......@@@..@@@......
.......@....@.......
......@@@..@@@......
.....@...@@...@.....
....@@...f..t.@@....
...@.@.r.@@...@.@...
..@..@.....@@@@.@@@.
.@@@.@........@..@..
@.@.@f.r.p.tr.f@@@@@
.@@@.@........@.@@@.
.@.@..@@@@@@@@..@.@.
....................
....................
....................
`,


    // NOTE(justas): meh
`
.....@@.......@@....
.....@@.......@@....
.....@@..@@@@@@@@...
.....@@..@f@...f@...
....@@@@@@.@....@...
....@......@.t..@...
....@...t@.f..r.@...
....@.r.p..@..r.@...
....@......@....@...
....@@@@@@@@@@@@@...
.....@@.......@@....
.....@@.......@@....
.....@@.......@@....
.....@@.......@@....
`,

    // NOTE(justas): ok
`
...................
....@@@@@@@@@...... 
....@@@....@@......
....@@@.rt.@.......
....@@@@.r.@.......
....@@@@.r.@.......
....@@@@...@@......
....@@@@@f@@.......
....@......@.......
....@..t.p.@.......
....@f....f@@......
....@@@@@@@@@......
...................
...................
`,

    // NOTE(justas): meh
`
...................
...................
.......@@@@@@......
.......@....@@@....
.......@..t...@....
......@@.rrrrr@....
......@..trrrr@....
......@.@..fff@....
......@.@.pfff@....
......@.@..fff@....
......@.......@....
......@@@@@@@@@....
...................
...................
...................
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

    // NOTE(justas): good

`
....................
....................
....@@@@@@@.........
....@@@@@@@@@@......
....@....@...@......
....@.tr.f.tp@......
....@@.r.@...@......
....@@@f.@@@@@......
....@@@..@..........
....@f.r.@..........
....@@...@..........
.....@@@@@..........
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

function * co_fade(max_time, count_fn = null, done_fn = null) {
    let time = max_time;

    while(true) {
        if(time <= 0) {
            if(done_fn) {
                done_fn();
            }
            break;
        }
        else {
            time -= yield 0;
            let t = time / max_time;
            t = clamp(t, 0, 1);

            if(count_fn) {
                count_fn(t);
            }
        }
    }
}

function load_level(idx) {
    did_just_finish_level = false;

    localStorage.setItem("level", idx);
    state.current_level_index = idx;

    const l = levels[idx];

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

        if(!did_just_finish_level &&
            matching != 0 && 
            matching >= finish_count && 
            matching_visible == matching
        ) {
            did_just_finish_level = true;
            const next_level = (state.current_level_index + 1) % levels.length;

            if(next_level == 0) {
                // TODO(justas): 
                alert("winrar!");
            }

            begin_coroutine(co_fade(1, (t) => {
                render_alpha = square01(t);
            }, () => {
                begin_coroutine(co_fade(1, (t) => {
                    render_alpha = square01(flip01(t));
                }));

                load_level(next_level);
                update();
            }));

            playSound(52359700);
            return;
        }
    }

}

let is_loading = true;
let is_done_loading = false;
let is_in_main_menu = false;
let did_just_finish_level = false;
let main_menu_selected_index = 0;
let blink_selected_main_menu_opt = false;
let render_alpha = 1;
let render_volume_alpha = 1;

function blit_img(img, x, y, sx = 1, sy = 1, r = 0) {
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
}

function blit_anim(img_name, speed, count, x, y, sx = 1, sy = 1, r = 0) {
    const idx = 1 + Math.floor((animation_time / speed) % count);
    const img = images[img_name + String(idx)];
    blit_img(img, x, y, sx, sy, r);
}

function blit_text(sz, style, txt, x, y) {
    ctx.font = `${sz}px m6x11`;
    ctx.fillStyle = style;
    ctx.fillText(txt, x, y);
}

let prev_frame_idx = 0;
function redraw(time) {

    let dt = (time - prev_time) / 1000;

    if(prev_time === 0) {
        dt = 1/60;
    }

    prev_time = time;

    animation_time = time / 1000;

    sfxr_update_timeouts(dt);
    coroutines_tick(dt);

    const blit_bg = () => {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = "#23262d";
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = render_alpha;
    };

    const sel_color = "#f6e3f2";
    if(is_loading) {
        blit_bg();
        blit_text(16, sel_color, "LOADING", cw * .5 - 25, ch * .5);

        ctx.fillStyle = "#3b6439";

        let max_width = 48;
        let max = 0;
        let count = 0;

        for(let key in images_loaded) {
            max += 1;
            if(images_loaded[key]) {
                count += 1;
            }
        }

        if(!is_done_loading && max == count) {
            is_done_loading = true;

            begin_coroutine(co_fade(.5, (t) => {
                render_alpha = square01(t);

            }, () => {
                is_loading = false;

                begin_coroutine(co_fade(.5, (t) => {
                    render_alpha = square01(flip01(t));
                }));
            }));
        }

        let t = (count / max);
        ctx.fillRect(cw * .5 - 25, ch * .5 + 5, max_width * t, 10);
    }
    else if(is_in_main_menu) {
        blit_bg();

        blit_text(32, sel_color, "VISIONBAN", cw * .5 - 60, ch * .5 - 20);
        blit_text(16, sel_color, "by Justas Dabrila", cw * .5 - 20, ch * .5 - 7);

        const get_col = (idx) => {
            if(main_menu_selected_index == idx) {
                if(blink_selected_main_menu_opt) {
                    return "#b78b77";
                }
                return sel_color;
            }
            else {
                return "#3b6439";
            }
        };


        if(state.current_level_index == 0) {
            blit_text(16, get_col(0), "New Game", cw * .5 - 25, ch * .5 + 30);
        }
        else {
            blit_text(16, get_col(0), "Continue", cw * .5 - 25, ch * .5 + 30);
            blit_text(16, get_col(1), "Reset", cw * .5 - 28, ch * .5 + 45);
        }

        blit_anim("torch", .1, 4, 9.5, 2);
    }
    else {

        let frame_idx = Math.floor(time / (1000 / 10));
        if(prev_frame_idx == frame_idx) {
            requestAnimationFrame(redraw);
            return;
        }

        prev_frame_idx = frame_idx;

        blit_bg();

        ctx.save();

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x,y];

                if(!is_visible_at(p)) {
                    ctx.globalAlpha = render_alpha * .2;
                }
                else {
                    ctx.globalAlpha = render_alpha;
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
            ctx.globalAlpha = render_alpha * .2;
        }
        else {
            ctx.globalAlpha = render_alpha;
        }

        {
            if(render_volume_alpha > 0) {
                ctx.globalAlpha = render_volume_alpha * render_volume_alpha;

                blit_text(16, "#3b6439", String(audio_level), 
                    state.player.pos[0] * TILE_SCALE + 2, (state.player.pos[1] + 1) * TILE_SCALE
                );

                ctx.globalAlpha = 1 - ctx.globalAlpha;
            }

            blit_img(images["guy"], state.player.pos[0], state.player.pos[1]);
        }

        ctx.globalAlpha = render_alpha;

        if(state.current_level_index == 0) {
            blit_img(images["controls"], 6, 0);
            blit_img(images["controls2"], 6, 12);
        }

        ctx.restore();
    }

    requestAnimationFrame(redraw);
}

function is_solid_at(p) {
    return false;
}

function try_push(pos, delta, did_push) {
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

            if(!try_push(new_pos, delta, did_push)) {
                return false;
            }

            remove_tile(layer, pos);
            set_tile(layer, new_pos, tile);
            did_push.did = true;

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

    let did_push = {did: false};
    if(try_push(new_pos, delta, did_push)) {
        states.push(old_state);
        state.player.pos = new_pos;

        if(did_push.did) {
            let table = {
                snd1: 1,
                snd2: 1,
                snd3: 1,
            };

            let result = evaluate_table(table);

            if(result == "snd1") {
                playSound(81843707);
            }
            else if(result == "snd2") {
                playSound(58267107);
            }
            else if(result == "snd3") {
                playSound(20058707);
            }
        }
    }
    else {
        let table = {
            snd1: 1,
            snd2: 1
        };

        let result = evaluate_table(table);

        if(result == "snd1") {
            playSound(93417104);
        }
        else if(result == "snd2") {
            playSound(15655904);
        }
    }

    let table = {
        snd1: 1,
        snd2: 1,
        snd3: 1,
    };

    let result = evaluate_table(table);

    if(result == "snd1") {
        playSound(32905307);
    }
    else if(result == "snd2") {
        playSound(39368507);
    }
    else if(result == "snd3") {
        playSound(36528507);
    }

    update();
}

function begin_playing() {

    begin_coroutine(co_fade(1, (t) => {
        render_alpha = cubic01(t);

    }, () => {
        is_in_main_menu = false;
        update();
        begin_coroutine(co_fade(.5, (t) => {
            render_alpha = square01(flip01(t));
        }));
    }));
}

function move_main_menu_cursor(delta) {
    const play_move_snd = () => playSound(40086906);
    const play_block_snd = () => playSound(64503704);

    if(state.current_level_index == 0) {
        play_block_snd();
    }
    else {
        if(main_menu_selected_index == 0) {
            if(delta == -1) {
                play_block_snd();
            }
            else {
                play_move_snd();
                main_menu_selected_index = 1;
            }
        }
        else {
            if(delta == 1) {
                play_block_snd();
            }
            else {
                play_move_snd();
                main_menu_selected_index = 0;
            }
        }
    }
}

function update_key(e, is_down) {
    let ret = true;

    if(e.key == "w" || e.key == "W" || e.key == "ArrowUp") {
        if(is_down) {
            if(is_in_main_menu) {
                move_main_menu_cursor(-1);
            }
            else {
                try_walk_guy([0, -1]);
            }
            ret = false;
        }
    }

    if(e.key == "s" || e.key == "S" || e.key == "ArrowDown") {
        if(is_down) {
            if(is_in_main_menu) {
                move_main_menu_cursor(1);
            }
            else {
                try_walk_guy([0, 1]);
            }

            ret = false;
        }
    }

    if(e.key == "a" || e.key == "A" || e.key == "ArrowLeft") {
        if(is_down && !is_in_main_menu) try_walk_guy([-1, 0]);
        ret = false;
    }

    if(e.key == "d" || e.key == "D" || e.key == "ArrowRight") {
        if(is_down && !is_in_main_menu) try_walk_guy([1, 0]);
        ret = false;
    }

    if(e.key == "r" || e.key == "R") {
        if(is_down && !is_in_main_menu) {
            push_state();

            load_level(state.current_level_index);
            update();
        }
        ret = false;
    }

    if(e.key == "z" || e.key == "Z") {
        if(is_down && !is_in_main_menu) {
            pop_state();
            update();
        }
        ret = false;
    }

    if(is_down) {
        if(e.key == "-") {
            audio_level -= 1;
            update_volume();
        }
        if(e.key == "+" || e.key == "=") {
            audio_level += 1;
            update_volume();
        }
    }

    if(is_in_main_menu) {
        if(e.key == "x" || e.key == "X" || e.key == "Enter") {
            if(is_down) {

                playSound(57048103);

                function * co_blink() {
                    for(let i = 0; i < 20; i++) {
                        blink_selected_main_menu_opt = !blink_selected_main_menu_opt;
                        yield coroutine_sleep(.05);

                        if(i == 5) {
                            if(main_menu_selected_index == 0) {
                                begin_playing();
                            }
                            else if(main_menu_selected_index == 1) {
                                load_level(0);
                                begin_playing();
                            }
                        }
                    }
                    blink_selected_main_menu_opt = false;

                };

                begin_coroutine(co_blink());

                ret = false;
            }
        }
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

document.body.addEventListener("keyup",keyup);
document.body.addEventListener("keydown",keydown);

state.current_level_index = parseInt(localStorage.getItem("level"));

if(Number.isNaN(state.current_level_index)) {
	state.current_level_index = 0;
}

load_level(state.current_level_index);

update();
requestAnimationFrame(redraw);
