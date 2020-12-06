var agents = [];
var objects_on_map = [];
var effects = [];
var CANVAS_WIDTH = 1800;
var CANVAW_HEIGHT = 900;
var timer = 2;
var hp_loss_tick = false;
var food_count = 0;
var poison_count = 0;
var POPULATION_N = 35;
var POISON_N = 300;
var FOOD_N = 150;

class MapObject {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.r = 5;
        this.color = 'gray';
    }

    display() {
        fill(this.color);
        ellipse(this.position.x, this.position.y, this.r, this.r);
    }
}

class Food extends MapObject {
    constructor(x, y) {
        super(x, y);
        this.color = 'green';
        this.health_change = 20;
    }
}

class Poison extends MapObject {
    constructor(x, y) {
        super(x, y);
        this.color = 'red';
        this.health_change = 70;
    }
}

function collision_checker() {
    for(let i = 0; i < agents.length; ++i) {
        let closest_food = undefined;
        distance_to_closest = Infinity;
        let closest_poison = undefined;
        distance_to_closest_poison = Infinity;

        for(let j = 0; j < objects_on_map.length; ++j) {
            dist_to_food = dist(agents[i].position.x, agents[i].position.y, objects_on_map[j].position.x, objects_on_map[j].position.y);
            
            if (objects_on_map[j].constructor == Food && dist_to_food <= agents[i].DNA[2] && dist_to_food < distance_to_closest) {
                closest_food = objects_on_map[j];
                distance_to_closest = dist_to_food;
            }
            else if (objects_on_map[j].constructor == Poison && dist_to_food <= agents[i].DNA[3] && dist_to_food < distance_to_closest_poison) {
                closest_poison = objects_on_map[j];
                distance_to_closest_poison = dist_to_food;
            }
            
            if (dist_to_food < (agents[i].size * 0.2) + objects_on_map[j].r) {
                if (agents[i].eat(objects_on_map[j])) {
                    if (objects_on_map[j].constructor === Food) {
                        food_count--;
                        agents[i].food_eaten++;
                    }
                    else if (objects_on_map[j].constructor === Poison)  {
                        poison_count--;
                        agents[i].poison_eaten++;
                    }
                    let temp = objects_on_map[j];
                    objects_on_map[j] = objects_on_map[objects_on_map.length - 1];
                    objects_on_map[objects_on_map.length - 1] = temp;
                    objects_on_map.pop();
                    j--;
                }
            }
        }
        if (hp_loss_tick)
            agents[i].lose_hp(1);

        if (closest_food != undefined)
            agents[i].targets[0] = closest_food.position;
        
        if (closest_poison != undefined)
            agents[i].targets[1] = closest_poison.position;

    
        if(agents[i].health_points <= 0) {
            let temp = agents[i];
            agents[i].die_animation(effects);
            agents[i] = agents[agents.length - 1];
            agents[agents.length - 1] = temp;
            agents.pop();
            i--;
        }
    }
}

function mouseClicked() {
    spawn_agent();
    spawn_agent();
    spawn_agent();
}

function spawn_food() {
    objects_on_map.push(new Food(random(10, CANVAS_WIDTH - 10), random(10, CANVAW_HEIGHT - 10)));
    food_count++;
}

function spawn_poison() {
    objects_on_map.push(new Poison(random(10, CANVAS_WIDTH - 10), random(10, CANVAW_HEIGHT - 10)));
    poison_count++;
}

function spawn_agent() {
    agents.push(new Agent(random(0, CANVAS_WIDTH), random(0, CANVAW_HEIGHT)));
}

function gen_population() {
    for (let i = 0; i < POPULATION_N; ++i) {
        spawn_agent();
    }
}

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAW_HEIGHT);
    frameRate(60);
    for(let i = 0; i < 50; i++) {
        spawn_food();
        if (i % 2)
            spawn_poison()
    }
    
    gen_population();
}
  
function draw() {
    console.log(agents.length);
    if (agents.length > POPULATION_N) {
        agents.splice(0, agents.length - POPULATION_N);
    }
    background(51);
    if (food_count < FOOD_N)
        for (let i = 0; i < 20; ++i)
            spawn_food();

    if (poison_count < POISON_N)
        for (let i = 0; i < 20; ++i)
            spawn_poison();

    if (timer > 0) {
        timer -= 1;
        hp_loss_tick = false;
    }
    else {
        hp_loss_tick = true;
        timer = 2;
    }
    
    collision_checker();
    
    for (let i = 0; i < agents.length; ++i) {
        agents[i].seek();
        agents[i].update();
        agents[i].display();
    }

    for (let i = 0; i < effects.length; ++i) {
        effects[i].update();
        if (effects[i].end)
            effects.splice(i, 1);
        else
            effects[i].display();
    }

    noStroke();
    
    for(obj of objects_on_map) {
        obj.display();
    }
}
