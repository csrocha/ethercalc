var AthenaCache = {};

cleanCache = function(coord, soperand) {
        console.log(coord, soperand, "Clean cache.");

	if (coord in AthenaCache && soperand in AthenaCache[coord])
		delete AthenaCache[coord][soperand];
}

setCache = function(coord, soperand, type, value, timeout=null) {
        console.log(coord, soperand, "Filling cache.");

	if (!(coord in AthenaCache))
		AthenaCache[coord] = {};
	AthenaCache[coord][soperand] = {
			'type': type,
			'value': value
		};
	// Call one time...
	spreadsheet.editor.ScheduleSheetCommands("recalc");
	if (timeout)
		setTimeout(cleanCache, timeout, coord, soperand);
}

getCache = function(coord, soperand) {
	if (coord in AthenaCache && soperand in AthenaCache[coord]) {
		console.log(coord, soperand, "In cache.");
		return AthenaCache[coord][soperand]; 
	} else {
		console.log(coord, soperand, "Not in cache.", AthenaCache);
		return false;
	}
}

changeValue = function(coord, soperand, foperand) {
	setCache(coord, soperand, foperand[0].type, foperand[0].value);
}

document.addEventListener('DOMContentLoaded', function(){

	console.log("Creating new functions.");

	SocialCalc.Formula.testFunction = function(fname, operand, foperand, sheet, coord) {
   		var PushOperand = function(t, v) {operand.push({type: t, value: v});};
		var soperand = JSON.stringify(foperand);
		var res = getCache(coord, soperand);
		if (res) {
			PushOperand(res.type, res.value);
		} else {
			setTimeout(changeValue, 1000, coord, soperand, foperand);
			PushOperand("t", "Retrieving");
		}
	}
	
	
	SocialCalc.Formula.FunctionList["TESTF"] = [SocialCalc.Formula.testFunction, 1, "", "", "text"];

}, false);

