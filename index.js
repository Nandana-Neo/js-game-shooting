var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');
const friction = 0.99;

let pl, bullets, enemies, particles, score;

var scoreElement = document.getElementById("score");
var startGameBtn = document.getElementById("startGameBtn");

class Player{
    constructor(x,y,radius,color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0 , 2*Math.PI, true);
        c.fillStyle = this.color;
        c.fill();
    }
}

//Whenever the window resizes, the canvas size changes and the player needs to be centered
function resize() {
    canvas.width = this.innerWidth;
    canvas.height = this.innerHeight;

    pl.x = (canvas.width / 2);
    pl.y = (canvas.height / 2);
    pl.draw();
}
addEventListener("resize",resize);

//For the bullet and enemeies
class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0 , 2*Math.PI, true);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

//For particles after explosion
class Particle{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
        this.alpha =1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0 , 2*Math.PI, true);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}
function init(){
    pl = new Player((canvas.width / 2),(canvas.height / 2),10,'white');
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreElement.innerText = score;
}

//For the obstacles
let intervalId;
function spawnEnemies(){
    intervalId = setInterval(() => {
        let x,y;
        const rad = Math.random()*(30-10) + 10;
        const sp = 1;
        switch(Math.floor(Math.random()*4)){
            case 0:{
                x=0-rad;
                y=Math.random()*canvas.height;
                break;
            }
            case 1:{
                x=Math.random()*canvas.width;
                y=0-rad;
                break;
            }
            case 2:{
                x=canvas.width + rad;
                y=Math.random()*canvas.height;
                break;
            }
            case 3:{
                x=Math.random()*canvas.width;
                y=canvas.height + rad;
                break;
            }
        }
        const angle = Math.atan2(pl.y-y , pl.x-x);
        const enemy = new Projectile(
            x,
            y,
            rad,
            `hsl(${Math.random()*360},50%,50%)`, //0 to 359
            {
                x : sp*Math.cos(angle),
                y : sp*Math.sin(angle)
            }
        );
        enemies.push(enemy);
    }, 1000);
}

let animationId;
function animate(){
    animationId = requestAnimationFrame(animate);

    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.fillRect(0,0,canvas.width, canvas.height);
    pl.draw();
    particles.forEach((p,i)=>{
        if(p.alpha <= 0){
            particles.splice(i,1);
        }
        else {
            p.update();
        }
    })
    bullets.forEach((bullet,bulletIndex) => {
        //If the bullet goes outside screen
        if(bullet.x-bullet.radius > canvas.width || bullet.x+bullet.radius < 0 || bullet.y-bullet.radius > canvas.height || bullet.y+bullet.radius < 0){
            setTimeout(() => {
                bullets.splice(bulletIndex,1);
            }, 0);
        }
        bullet.update();
    })
    enemies.forEach((enemy,enemyIndex) => {
        enemy.update();
        //Checking if enemy hit the player
        const dist = Math.hypot(pl.x - enemy.x , pl.y - enemy.y);
        if(dist - enemy.radius - pl.radius < 1){
            cancelAnimationFrame(animationId);
            var div = document.getElementById("newGame");
            div.style.display = "grid";
            var scoreCard = div.querySelector("h1");
            scoreCard.innerText = score;          
            clearInterval(intervalId); 
        }
        //Checking when a bullet hits the enemy
        bullets.forEach((bullet,bulletIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x , bullet.y - enemy.y);
            if(dist - enemy.radius - bullet.radius < 1){
                //Reduce enemy size if possible
                if(enemy.radius - 10 >= 5){
                    score +=100;
                    gsap.to(enemy,{
                        radius: enemy.radius - 10
                    });
                    setTimeout(()=>{
                        bullets.splice(bulletIndex,1);
                    }, 0);
                } else {
                    score += 150;
                    for(let i=0;i<enemy.radius * 2;i++){
                        particles.push(new Particle(
                            enemy.x,
                            enemy.y,
                            Math.random() * 2,
                            enemy.color,
                            {
                                x: 8*(Math.random() - 0.5),
                                y: 8*(Math.random() - 0.5)
                            }
                        ))
                    }
                    setTimeout(()=>{
                        bullets.splice(bulletIndex,1);
                        enemies.splice(enemyIndex,1);
                    }, 0);
                }

                scoreElement.innerText = score;
            }
        }
    )
    })
}
addEventListener("click",(event)=> {
    const angle = Math.atan2(event.clientY-pl.y, event.clientX-pl.x);
    const bullet = new Projectile(
        pl.x,
        pl.y,
        5,
        'white',
        {
            x: 5*Math.cos(angle),
            y: 5*Math.sin(angle)
        }
    );
    bullets.push(bullet);
});

startGameBtn.addEventListener("click",()=> {
    var div = document.getElementById("newGame");
    div.style.display = "none";
    canvas.width = canvas.width; // Resets canvas
    init();
    animate();
    spawnEnemies();
});