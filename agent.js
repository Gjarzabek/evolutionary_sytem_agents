var MAX_SURVIVAL_TIME = 250000;
var MAX_FOOD_POISON_POINTS = 50;
var MAX_AGENTS_REPRODUCED = 12;
var MUTATION_RATE = 0.1;
var REPRODUCTION_RATE = 0.1;

class Agent {

    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(random(-2, 2), random(-2, 2));
        this.acceleration = createVector(0 ,0);
        this.maxspeed = 2;
        this.maxforce = 0.5;
        this.size = 20;
        this.max_HP = 90;
        this.health_points = this.max_HP;
        this.hp_loss = 1;
        this.color = 'green';
        this.targets = [this.position, this.position];
        this.DNA = [random(-5, 5), random(-5, 5), random(4, 250), random(4, 250)];
        this.spawn_time = Date.now();
        this.poison_eaten = 0;
        this.food_eaten = 0;
    }
   
    update() {
        
        // dont let agent to go out of a canvas;
        let check_vec = p5.Vector.add(this.position, 0);
        let force_vec = createVector(0, 0);
        if (check_vec.x + this.velocity.x > CANVAS_WIDTH) {
            force_vec = createVector(-1, 0);
            force_vec.setMag(this.maxforce * 1.5);
        }
        else if (check_vec.x + this.velocity.x < 0) {
            force_vec = createVector(1, 0);
            force_vec.setMag(this.maxforce * 1.5);
        }
        else if (check_vec.y + this.velocity.y > CANVAW_HEIGHT) {
            force_vec = createVector(0, -1);
            force_vec.setMag(this.maxforce * 1.5);
        }
        else if (check_vec.y + this.velocity.y < 0) {
            force_vec = createVector(0, 1);
            force_vec.setMag(this.maxforce * 1.5);
        }
        this.applyForce(force_vec);
        
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }

    seek() {
        for(let i = 0; i < 2; ++i) {
            var desired = p5.Vector.sub(this.targets[i], this.position);
            // scale to maximum speed
            desired.setMag(this.maxspeed);

            var steer = p5.Vector.sub(desired, this.velocity);
            steer.mult(this.DNA[i]);
            steer.limit(this.maxforce);

            this.applyForce(steer);
        }
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    display() {
        // wyswietlenie agenta
        var direction_angle = this.velocity.heading();
        var front_vertex = createVector(this.size * cos(direction_angle), this.size * sin(direction_angle))

        this.color = lerpColor(color('red'), color('green'), this.health_points / this.max_HP);
        fill(this.color);

        beginShape();
        vertex(this.position.x + front_vertex.x, this.position.y + front_vertex.y);
        front_vertex.mult(0.3);
        angleMode(DEGREES);
        front_vertex.rotate(130);
        vertex(this.position.x + front_vertex.x, this.position.y + front_vertex.y);
        front_vertex.rotate(100);
        vertex(this.position.x + front_vertex.x, this.position.y + front_vertex.y);
        endShape();
        noFill();
        stroke(0, 255, 0);
        strokeWeight(0.5);
        ellipse(this.position.x, this.position.y, this.DNA[2], this.DNA[2]);
        stroke(255, 0, 0);
        strokeWeight(0.5);
        ellipse(this.position.x, this.position.y, this.DNA[3], this.DNA[3]);
    }

    lose_hp(hp) {
        this.health_points -= hp;
    }

    gain_hp(hp) {
        this.health_points += hp;
        if (this.health_points > this.max_HP)
            this.health_points = this.max_HP;
    }

    fitness_function() {
        let time_points = (Date.now() - this.spawn_time);
        if (time_points > MAX_SURVIVAL_TIME)
            time_points = MAX_SURVIVAL_TIME;
        time_points = map(time_points, 0, MAX_SURVIVAL_TIME, 0, 1);
        
        let gather_points = 0;
        if (this.poison_eaten == 0)
            gather_points = this.food_eaten;
        else
            gather_points = this.food_eaten / this.poison_eaten;

        gather_points = map(gather_points, 0, MAX_FOOD_POISON_POINTS, 0, 1);
        return parseInt(round(map(gather_points+time_points, 0, 2, 0, MAX_AGENTS_REPRODUCED)));
    }
    
    reproduce() {
        var child_to_spawn = this.fitness_function();
        for (let i = 0; i < child_to_spawn; ++i) {
            var child = new Agent(random(this.size, CANVAS_WIDTH - this.size), random(this.size, CANVAW_HEIGHT - this.size));
            for (let j = 0; j < this.DNA.length; ++j)
                child.DNA[j] = this.DNA[j];
            child.mutate();
            agents.push(child);
        }
    }

    mutate() {
        if (random(1) < MUTATION_RATE)
            this.DNA[0] += random(-1, 1);
        if (random(1) < MUTATION_RATE)
            this.DNA[1] += random(-1, 1);

        if (random(1) < MUTATION_RATE) {
            this.DNA[2] += random(-50, 50);
            if (this.DNA[2] < 0)
            this.DNA[2] = 0;
        }
        
        if (random(1) < MUTATION_RATE) {
            this.DNA[3] += random(-50, 50);
            if (this.DNA[3] < 0)
            this.DNA[3] = 0;
        }
    }

    die_animation(effects) {
        this.reproduce();
        effects.push(new Explosion(this.position, this.size));
    }

    eat(obj) {
        if (obj.constructor === Food) {
            this.gain_hp(obj.health_change);
            return true;
        }
        else if (obj.constructor === Poison) {
            this.lose_hp(obj.health_change);
            return true;
        }
        else return false;
    }
}

class Explosion {
    constructor(position, size) {
        this.position = position;
        this.size = size;
        this.current_size = 6;
        this.TTL = 15;
        this.frames = this.TTL;
        this.per_frame = (this.size * 2) / this.frames;
        this.end = false;
        this.color = color('red');
    }

    update() {
        if (this.frames <= 0)
            this.end = true;
        this.frames--;
        this.current_size += this.per_frame;
    }

    // TODO: rekursywnie wyświetlam okręgi by uzyskać efekt wybuchu
    display() {
        noFill();
        this.color = lerpColor(color('red'), color('orange'), this.frames / this.max_HP);
        stroke(color('red'));
        ellipse(this.position.x, this.position.y, this.current_size, this.current_size);
    }
}
