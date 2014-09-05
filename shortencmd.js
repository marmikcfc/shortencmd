#!/usr/bin/env node

var prog = require('commander');
var shell = require('shelljs');
var fs = require('fs');
var colors = require('colors');
var file = __dirname+'/.cdb';

prog
  .version('shortencmd v0.0.1'.blue)
  .option('-a, --add [command -> shortcut]', 'Enter a command that you would like to shortcut.', 'null')
  .option('-r, --remove [shortcut]', 'Enter the shortcut to be removed from the saved commands.', 'null')
  .option('-ex, --execute [shortcut]', 'Enter the shortcut to run the saved command.', 'null')
  .option('-p, --print', 'Prints the list of saved shortcuts')
  .option('-i, --import [commands]', 'Imports the commands that was exported from another shortencmd collection', 'null')
  .option('-e, --export', 'Exports all the commands in your shortencmd collection');


prog.on('--help', function() {
  shell.echo('  ' + 'Example Usage:'.underline);
  shell.echo('');
  shell.echo('  > Add new command and its shortcut'.blue);
  shell.echo('    $ sc -a "node -> n"'.green);
  shell.echo('  > Execute a shortcut'.blue);
  shell.echo('    $ sc -ex "n"'.green);
  shell.echo('  > Print saved shortcuts'.blue);
  shell.echo('    $ sc -p'.green);
  shell.echo('  > Remove a shortcut'.blue);
  shell.echo('    $ sc -r "n"'.green);
  shell.echo('  > Export your genricmd shortcuts'.blue);
  shell.echo('    $ sc -e'.green);
  shell.echo('  > import shortencmd shortcuts'.blue);
  shell.echo('    $ sc -i \'[{"command":"node","shortcut":"n"},{"command":"ls -ltr","shortcut":"l"}]\''.green);
  shell.echo('');
});

prog.parse(process.argv);


if (!fs.existsSync(file)) {
  fs.writeFileSync(file, '[]');
}

if (prog.rawArgs.length == 2) {
  shell.echo('Please enter valid argumets'.red);
  prog.help();
}

if (prog.add && prog.rawArgs.indexOf('-a') > 0) {
  var _a = prog.add;
  if (_a == 'null') {
    shell.echo('Please enter a valid command.'.red);
    helpAdd();
  } else {
    if (_a.indexOf('->') > 0) {

      var _c = JSON.parse(fs.readFileSync(file)),
        _o = {
          command: _a.split('->')[0].trim(),
          shortcut: _a.split('->')[1].trim()
        };

      if (checkDuplicate(_c, _o)) {
        _c.push(_o);

        fs.writeFileSync(file, JSON.stringify(_c, null, 0));
        shell.echo('A new entry has been successfully added'.blue);
        _print(_c);
      }


    } else {
      shell.echo('You need separate the command and shortcut with a "->"'.red);
      helpAdd();
    }
  }
}

if (prog.remove && prog.rawArgs.indexOf('-r') > 0) {
  var _r = prog.remove;
  if (_r == 'null') {
    shell.echo('Please enter a valid command.'.red);
    helpRemove();
  } else {
    var _c = JSON.parse(fs.readFileSync(file)),
      deleted = false;
    for (var i = 0; i < _c.length; i++) {
      if (_c[i]['shortcut'] == _r) {
        _c.splice(i, 1);
        if (_c.length == 0) {
          fs.writeFileSync(file, '[]');
          shell.echo('The shortcut has been successfully deleted'.blue);
          shell.echo('There are no commands in your shortencmd collection.'.magenta);
        } else {
          fs.writeFileSync(file, JSON.stringify(_c, null, 0));
          shell.echo('The shortcut has been successfully deleted'.blue);
          _print(_c);
        }
        deleted = true;
        return;
      }
    };

    if (!deleted)
      shell.echo('No Matching shortcut found'.red);
  }
}

if (prog.rawArgs[2] != '-ex' && prog.rawArgs[2] != '-p' && prog.rawArgs[2] != '-e' && prog.rawArgs[2] != '-i' && prog.rawArgs[2] != '-a' && prog.rawArgs[2] != '-r') {
  executeCommand(prog.rawArgs[2], '0');
}

if (prog.execute && prog.rawArgs.indexOf('-ex') > 0) {
  executeCommand(prog.execute, '1');
}

if (prog.export) {
  shell.echo(fs.readFileSync(file, 'utf-8'));
}

if (prog.import && prog.rawArgs.indexOf('-i') > 0) {
  var _i = prog.import;
  if (_i == 'null') {
    shell.echo('Please enter a valid export data.'.red);
    helpImport();
  } else {
    try {
      var _ij = JSON.parse(_i),
        _c = JSON.parse(fs.readFileSync(file)),
        added = _c.length;

      _c = unique(_c.concat(_ij));
      added = _c.length - added;

      if (added > 0) {
        fs.writeFileSync(file, JSON.stringify(_c, null, 0));
        shell.echo(added + ' shortcuts have been merged with your shortencmd collection'.green);
        _print(_c);
      } else {
        shell.echo(added + ' shortcuts have been merged with your shortencmd collection'.magenta);
      }

    } catch (err) {
      shell.echo('Invalid export data.'.red, err);
      helpImport();
    }
  }
}

if (prog.print) {
  var commands = JSON.parse(fs.readFileSync(file));
  _print(commands);
}

function _print(commands) {
  if (commands.length > 0) {
    var op = '';
    for (var i = 0; i < commands.length; i++) {
      op += '\t' + commands[i].shortcut.green + ' \t ' + commands[i].command.blue + '\n'
    };
    shell.echo('List of saved commands : \n'.magenta);
    shell.echo('\tShortcut\tCommand'.grey);
    shell.echo(op);
  } else {
    shell.echo('There are no commands in your shortencmd collection.'.magenta);
    helpAdd();
  }
}

function helpAdd() {
  shell.echo('');
  shell.echo('  > Add new command and its shortcut'.blue);
  shell.echo('    $ sc -a "node -> n"'.blue);
}

function helpRemove() {
  shell.echo('');
  shell.echo('  > Remove a shortcut'.blue);
  shell.echo('    $ sc -r "n"'.blue);
}

function helpImport() {
  shell.echo('  > import shortencmd shortcuts'.blue);
  shell.echo('    $ sc -i \'[{"command":"node","shortcut":"n"},{"command":"ls -ltr","shortcut":"l"}]\''.green);
}

function executeCommand(_x, _m) {
  if (_x == 'null') {
    shell.echo('Please enter a valid shortcut to execute'.red);
    shell.echo('To see a list of saved shortcuts, run '.blue);
    shell.echo('    $ sc -p'.green);
  } else {
    var _c = JSON.parse(fs.readFileSync(file)),
      command;
    for (var i = 0; i < _c.length; i++) {
      if (_c[i]['shortcut'] == _x) {
        command = _c[i]['command']
      }
    };
    if (command) {
      var msg = 'Executing "' + command + '"...';
      shell.echo(msg.green);
      if (command.indexOf('*') > 0) {
        if (_m == "1") {
          command = processCommand(command, 4);
        } else {
          command = processCommand(command, 3);
        }
        shell.exec(command);
      } else {
        shell.exec(command);
      }
    } else {
      shell.echo('The entered shortcut is not saved yet!'.red);
      helpAdd();
    }
  }
}

function checkDuplicate(_c, _o) {
  for (var i = 0; i < _c.length; i++) {
    if (_c[i]['command'] == _o['command'] || _c[i]['shortcut'] == _o['shortcut']) {
      shell.echo('An entry already exists with the given command or shortcut'.red);
      _print(_c);
      return false;
    }
  };
  return true;
}

function processCommand(command, _c) {

  if (prog.rawArgs.length > _c && command.match(/\*/g).length + _c == prog.rawArgs.length) {
    var _d = command.split('*').filter(function(e) {
      return e
    });
    command = '';
    for (var i = 0, j = _c; i < _d.length; i++) {
      command += _d[i];
      var _t = prog.rawArgs[j++]
      if (_t) {
        command += "\"" + _t + "\"";
      }
    };
    return command;
  } else {
    shell.echo('Please enter valid data for the arguments'.red);
    shell.echo('    $ ' + command.blue);
    return false;
  }
}

function unique(obj) {
  var uniques = [];
  var stringify = {};
  for (var i = 0; i < obj.length; i++) {
    var keys = Object.keys(obj[i]);
    keys.sort(function(a, b) {
      return a - b
    });
    var str = '';
    for (var j = 0; j < keys.length; j++) {
      str += JSON.stringify(keys[j]);
      str += JSON.stringify(obj[i][keys[j]]);
    }
    if (!stringify.hasOwnProperty(str)) {
      uniques.push(obj[i]);
      stringify[str] = true;
    }
  }
  return uniques;
}
