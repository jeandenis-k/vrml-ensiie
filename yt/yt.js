//Path finfing
function house1(time) { walkToCoords([0,0], time);}
function door1(time) { walkToCoords([0,5], time); }
function cross1(time) { walkToCoords([5, 5], time); }

function house2(time) { walkToCoords([-20,0], time); }
function door2(time) { walkToCoords([-20,5], time); }
function cross2(time) { walkToCoords([5, 15], time); }

function house3(time) { walkToCoords([0, 21], time); }
function door3(time) { walkToCoords([0, 16], time); }
function cross3(time) { walkToCoords([5, 16], time); }

function house4(time) { walkToCoords([-20, 21], time); }
function door4(time) { walkToCoords([-20, 16], time); }

//Actions triggered when destination reached
pendingActions = [];

function testWalk(time) {
	//walkToCoords(door1, time);
	//pendingActions = pendingActions.concat(function(time) {walkToCoords(cross1, time);});
	
	// var waypoints = [];
	// waypoints[0] = cross1;
	// waypoints[1] = cross3;
	// waypoints[2] = house3;
	// //, cross3, door3, house3, door3, door4, house4);
	// //Create an array of actions
	var actions = [];
	// for(var i=0; i< 3; i++) {
		// actions[i] = function(time) {walkTo(waypoints[i][0], waypoints[i][1], time);};
	// }
	actions[0] = door1;
	
	// actions[1] = function(time) {
		// var i = Math.floor(Math.random() * 2);
		// if(i == 0) {
			// return [cross1, cross3, cross1, door1, house1];
		// } else {
			// return [door4, house4];
		// }
	// }
	
	actions[1] = cross1;
	actions[2] = cross3;
	actions[3] = cross1;
	actions[4] = door1;
	actions[5] = house1;
	
	
	//pendingActions = pendingActions.concat(actions);
	
	// Cycle these actions
	cycleActions(actions);
	callPendingAction(time);
}

function cycleActions(actions) {
	var addActions = function(time) {
		pendingActions = pendingActions.concat(actions);
		pendingActions = pendingActions.concat(addActions);
		callPendingAction(time);
	}
	
	pendingActions = pendingActions.concat(actions);
	pendingActions = pendingActions.concat(addActions);
}

function callPendingAction(time) {
	if(pendingActions.length == 0)
		return;

	var action = pendingActions[0];
	
	if(action == null) {
		pendingActions.shift();
		return;
	}
	
	//Multi-valued action
	if(action instanceof Array) {
		if(action.length > 0) {
			var first = action.shift();
			first(time);
			return;
		} else {
			pendingActions.shift();
			callPendingAction(time);
		}
	}
	
	//Single action, execute and inspect
	var result = action(time);
	
	if(result instanceof Array && result.length > 0) {
		//Several actions returned
		pendingActions[0] = result;
		callPendingAction(time);
	} else {
		pendingActions.shift();
	}
}

//Update VRML animations

function updateStandAnim() {
	for(var i=0; i<3; i++) {
		standBodyTran.keyValue[0][i] = hanim_HumanoidRoot.translation[i];
		standBodyTran.keyValue[1][i] = hanim_HumanoidRoot.translation[i];
	}
	for(var i=0; i<4; i++) {
		standBodyRot.keyValue[0][i] = hanim_HumanoidRoot.rotation[i];
		standBodyRot.keyValue[1][i] = hanim_HumanoidRoot.rotation[i];
	}
}

function updateWalkAnim() {
	var dx = Math.sin(currentAngle);
    var dz = Math.cos(currentAngle);
	var x0 = hanim_HumanoidRoot.translation[0];
	var z0 = hanim_HumanoidRoot.translation[2];
	var steps = [0, 0.04167, 0.125, 0.1667, 0.2083, 0.25, 0.2917, 0.375, 0.4583, 0.5, 0.5417, 0.5833, 0.625, 0.7083, 0.75, 0.7917, 0.875, 0.9167, 1]
	for(var i = 0; i < 19; i++) {
		walkBodyTran.keyValue[i][0] = x0 + steps[i] * dx;
		walkBodyTran.keyValue[i][2] = z0 + steps[i] * dz;
	}
	
	walkBodyRot.key = new Array(0, 0.25, 1);
	
	walkBodyRot.keyValue[0][0] = 0;
	walkBodyRot.keyValue[0][1] = 1;
	walkBodyRot.keyValue[0][2] = 0;
	walkBodyRot.keyValue[0][3] = hanim_HumanoidRoot.rotation[3];
		
	walkBodyRot.keyValue[1][0] = 0;
	walkBodyRot.keyValue[1][1] = 1;
	walkBodyRot.keyValue[1][2] = 0;
	walkBodyRot.keyValue[1][3] = currentAngle;
		
	walkBodyRot.keyValue[2][0] = 0;
	walkBodyRot.keyValue[2][1] = 1;
	walkBodyRot.keyValue[2][2] = 0;
	walkBodyRot.keyValue[2][3] = currentAngle;
}

function walkTo(x1, z1, time) {
	var x0 = hanim_HumanoidRoot.translation[0];
	var z0 = hanim_HumanoidRoot.translation[2];
	var angle = Math.atan2(x1 - x0, z1 - z0);
	var dist = Math.sqrt(Math.pow((x1 - x0), 2) + Math.pow((z1 - z0), 2));
	startWalk(angle, dist, time);
}

function walkToCoords(coords, time) {
	walkTo(coords[0], coords[1], time);
}

function startWalk(angle, length, time) {
	//Update state
    cyclesNb = Math.floor(length);
	cyclesFraction = length % 1.0;
	currentAngle = angle;
	
	//Walk!
	updateWalkAnim();
	Walk_Time.set_enabled = true;
    Walk_Time.set_startTime = time;
}

function continueWalk(b, time) {
    if(!b && cyclesNb == 0) {
		updateWalkAnim();
		
		if(cyclesFraction > 0.0) {
			//Stop animation when endFraction of animation reached
			Browser.addRoute(Walk_Time, "fraction_changed", this, "stopWalk");
			updateWalkAnim();
			Walk_Time.set_startTime = time;
		} else {
			updateStandAnim();
			Stand_Time.set_startTime = time;
			callPendingAction(time);
		}
		
    } else if(!b && cyclesNb > 0) {
		//Trigger new cycle
		updateWalkAnim();
		Walk_Time.set_startTime = time;
    } else {
		//Start cycle
		cyclesNb--;
    }
}

function stopWalk(fraction, time) {
	//Stop animation when endFraction of it reached
	if(fraction >= cyclesFraction) {
		Walk_Time.set_enabled = false;
		Browser.deleteRoute(Walk_Time, "fraction_changed", this, "stopWalk");
		updateStandAnim();
		Stand_Time.set_startTime = time;
		cyclesFraction = 0.;
		callPendingAction(time);
	}	
}