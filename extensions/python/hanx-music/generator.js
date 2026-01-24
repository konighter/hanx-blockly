// HanX Music Creation Extension - Python Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

generator.forBlock['music_init'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  generator.definitions_['import_numpy'] = 'import numpy as np';
  generator.definitions_['music_tempo'] = '_music_tempo = 120  # BPM';
  generator.definitions_['music_sample_rate'] = '_music_sample_rate = 44100';
  
  generator.definitions_['func_play_tone'] = 
`def _play_tone(frequency, duration_ms):
    """播放指定频率和时长的声音"""
    if frequency <= 0:
        pygame.time.wait(duration_ms)
        return
    n_samples = int(_music_sample_rate * duration_ms / 1000)
    t = np.linspace(0, duration_ms / 1000, n_samples, False)
    wave = np.sin(frequency * 2 * np.pi * t) * 0.3
    wave = (wave * 32767).astype(np.int16)
    stereo_wave = np.column_stack((wave, wave))
    sound = pygame.sndarray.make_sound(stereo_wave)
    sound.play()
    pygame.time.wait(duration_ms)`;

  generator.definitions_['note_freq_map'] = 
`_note_frequencies = {
    'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349, 'G4': 392, 'A4': 440, 'B4': 494,
    'C5': 523, 'D5': 587, 'E5': 659, 'F5': 698, 'G5': 784
}`;

  return 'pygame.mixer.init(frequency=_music_sample_rate, size=-16, channels=2)\n';
};

generator.forBlock['music_play_note'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  var note = block.getFieldValue('NOTE');
  var beat = generator.valueToCode(block, 'BEAT', 3) || '1';
  return '_play_tone(_note_frequencies["' + note + '"], int(60000 / _music_tempo * ' + beat + '))\n';
};

generator.forBlock['music_play_frequency'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  var freq = generator.valueToCode(block, 'FREQ', 3) || '440';
  var duration = generator.valueToCode(block, 'DURATION', 3) || '500';
  return '_play_tone(' + freq + ', ' + duration + ')\n';
};

generator.forBlock['music_set_tempo'] = function(block) {
  var bpm = generator.valueToCode(block, 'BPM', 3) || '120';
  return '_music_tempo = ' + bpm + '\n';
};

generator.forBlock['music_rest'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  var beat = generator.valueToCode(block, 'BEAT', 3) || '1';
  return 'pygame.time.wait(int(60000 / _music_tempo * ' + beat + '))\n';
};

generator.forBlock['music_note_value'] = function(block) {
  var note = block.getFieldValue('NOTE');
  return ['"' + note + '"', 3];
};

generator.forBlock['music_beat_value'] = function(block) {
  var beat = block.getFieldValue('BEAT');
  return [beat, 3];
};

generator.forBlock['music_play_melody'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  var melody = generator.valueToCode(block, 'MELODY', 3) || '[]';
  return 'for _note in ' + melody + ':\n    if _note in _note_frequencies:\n        _play_tone(_note_frequencies[_note], int(60000 / _music_tempo))\n';
};

generator.forBlock['music_stop'] = function(block) {
  generator.definitions_['import_pygame'] = 'import pygame';
  return 'pygame.mixer.stop()\n';
};
