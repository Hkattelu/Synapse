extends CharacterBody2D
class_name Player

# Player movement and interaction script for Godot

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0
@export var health: int = 100 : set = set_health

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var audio_player: AudioStreamPlayer2D = $AudioStreamPlayer2D

signal health_changed(new_health: int)
signal player_died

# Get the gravity from the project settings to be synced with RigidBody nodes
var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")
var is_jumping = false

func _ready():
    print("Player initialized with health: ", health)
    connect_signals()

func _physics_process(delta):
    # Add gravity
    if not is_on_floor():
        velocity.y += gravity * delta

    # Handle jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity
        is_jumping = true
        play_jump_sound()

    # Handle movement
    var direction = Input.get_axis("ui_left", "ui_right")
    if direction != 0:
        velocity.x = direction * speed
        sprite.flip_h = direction < 0
        if is_on_floor():
            sprite.play("run")
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        if is_on_floor():
            sprite.play("idle")

    # Update animation based on state
    if not is_on_floor():
        if velocity.y < 0:
            sprite.play("jump")
        else:
            sprite.play("fall")

    velocity = move_and_slide()
    
    # Check if we landed
    if is_jumping and is_on_floor():
        is_jumping = false
        play_land_sound()

func set_health(value: int):
    var old_health = health
    health = clamp(value, 0, 100)
    
    if health != old_health:
        health_changed.emit(health)
        
        if health <= 0:
            die()

func take_damage(amount: int):
    set_health(health - amount)
    
    # Flash red when taking damage
    var tween = create_tween()
    tween.tween_property(sprite, "modulate", Color.RED, 0.1)
    tween.tween_property(sprite, "modulate", Color.WHITE, 0.1)

func heal(amount: int):
    set_health(health + amount)

func die():
    print("Player died!")
    player_died.emit()
    
    # Play death animation
    sprite.play("death")
    
    # Disable collision
    collision_shape.set_deferred("disabled", true)
    
    # Wait for animation to finish, then respawn or game over
    await sprite.animation_finished
    respawn()

func respawn():
    health = 100
    position = Vector2(0, 0)  # Reset to spawn point
    collision_shape.disabled = false
    sprite.play("idle")
    print("Player respawned!")

func connect_signals():
    health_changed.connect(_on_health_changed)
    player_died.connect(_on_player_died)

func play_jump_sound():
    if audio_player.stream:
        audio_player.play()

func play_land_sound():
    # Play landing sound effect
    pass

func _on_health_changed(new_health: int):
    print("Health changed to: ", new_health)

func _on_player_died():
    print("Game Over!")

# Called when the player enters an area
func _on_area_2d_body_entered(body):
    if body.is_in_group("enemies"):
        take_damage(10)
    elif body.is_in_group("powerups"):
        heal(20)
        body.queue_free()