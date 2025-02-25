// models/classes.jsx
class Animal {
    constructor(nr, age, mass, hunger, stamina) {
        this.nr = Number(nr) || 0;
        this.age = Number(age) || 0;
        this.mass = Number(mass) || 0;
        this.hunger = Number(hunger) || 0;
        this.stamina = Number(stamina) || 0;

        if (isNaN(this.nr) || isNaN(this.age) || 
            isNaN(this.mass) || isNaN(this.hunger) || 
            isNaN(this.stamina)) {
            throw new Error('All parameters must be valid numbers');
        }
    }

    isAlive() {
        return this.nr !== 0;
    }
}

class Deer extends Animal {
    constructor(nr, age, mass, hunger, stamina) {
        super(nr, age, mass, hunger, stamina);
        this.type = 'deer';
    }
}

class Wolf extends Animal {
    constructor(nr, age, mass, hunger, stamina) {
        super(nr, age, mass, hunger, stamina);
        this.type = 'wolf';
    }
}

class Tree {
    constructor(position, age, height, diameter, mass) {
        this.position = Number(position) || 0;
        this.age = Number(age) || 0;
        this.height = Number(height) || 0;
        this.diameter = Number(diameter) || 0;
        this.mass = Number(mass) || 0;

        // Validate all properties are numbers
        if (isNaN(this.position) || isNaN(this.age) || 
            isNaN(this.height) || isNaN(this.diameter) || 
            isNaN(this.mass)) {
            throw new Error('All Tree parameters must be valid numbers');
        }
    }

    // Make this a regular method rather than a getter
    isAlive() {
        return this.position !== 0;
    }
}

export { Animal, Deer, Wolf, Tree };