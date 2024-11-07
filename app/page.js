"use client"
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WorkoutScheduleCreator = () => {
  const [schedule, setSchedule] = useState({
    title: '',
    days: [
      {
        name: 'Giorno 1',
        exercises: [
          { name: '', sets: '', videoUrl: '' }
        ]
      }
    ]
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Imposta isClient a true solo sul client
  }, []);

  const addDay = () => {
    setSchedule(prev => ({
      ...prev,
      days: [...prev.days, {
        name: `Giorno ${prev.days.length + 1}`,
        exercises: [{ name: '', sets: '', videoUrl: '' }]
      }]
    }));
  };

  const addExercise = (dayIndex) => {
    setSchedule(prev => {
      const newDays = [...prev.days];
      // Controlla se l'array degli esercizi è vuoto prima di aggiungere un nuovo esercizio
      if (newDays[dayIndex].exercises.length === 0 || newDays[dayIndex].exercises[newDays[dayIndex].exercises.length - 1].name !== '') {
        newDays[dayIndex].exercises.push({ name: '', sets: '', videoUrl: '' });
      }
      return { ...prev, days: newDays };
    });
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    setSchedule(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex].exercises.splice(exerciseIndex, 1);
      return { ...prev, days: newDays };
    });
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setSchedule(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex].exercises[exerciseIndex][field] = value;
      return { ...prev, days: newDays };
    });
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    
    // Aggiungi il titolo
    pdf.setFontSize(20);
    pdf.text(schedule.title || 'Scheda Allenamento', 20, 20);

    let yOffset = 40;

    schedule.days.forEach((day, index) => {
      // Aggiungi il titolo del giorno
      pdf.setFontSize(16);
      pdf.text(day.name, 20, yOffset);
      
      // Crea la tabella degli esercizi
      const tableData = day.exercises.map(ex => [
        ex.name,
        ex.sets,
        ex.videoUrl
      ]);

      autoTable(pdf, {
        head: [['Esercizio', 'Serie', 'Video URL']],
        body: tableData,
        startY: yOffset + 10,
        margin: { left: 20 },
        theme: 'grid',
        styles: { fontSize: 12 },
        didParseCell: (data) => {
          if (data.cell.raw && data.cell.raw.startsWith('http')) { // Controlla se è un URL
            const url = data.cell.raw;
            const cell = data.cell;
            const x = cell.x + cell.width / 2;
            const y = cell.y + cell.height / 2;
            pdf.link(x, y, cell.width, cell.height, { url }); // Crea il link
          }
        }
      });

      yOffset = pdf.lastAutoTable.finalY + 20;

      // Se stiamo per superare la pagina, aggiungi una nuova pagina
      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 20;
      }
    });

    pdf.save('scheda-allenamento.pdf');
  };

  const videoOptions = {
    "Panca": "http://example.com/campo",
    "Addome": "http://example.com/esercizio1",
    "Bicipiti": "http://example.com/esercizio2",
    // Aggiungi altre opzioni qui
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header con titolo */}
      {isClient && ( // Renderizza solo se siamo sul client
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <input
            type="text"
            placeholder="Titolo della scheda"
            value={schedule.title}
            onChange={(e) => setSchedule(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-xl font-bold border-b-2 border-gray-200 focus:border-blue-500 text-black focus:outline-none"
          />
        </div>
      )}
      
      {/* Giorni di allenamento */}
      {schedule.days.map((day, dayIndex) => (
        <div key={dayIndex} className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{day.name}</h2>
          
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 border-b">Esercizio</th>
                <th className="text-left p-2 border-b">Serie</th>
                <th className="text-left p-2 border-b">Video URL</th>
                <th className="w-20 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((exercise, exerciseIndex) => (
                <tr key={exerciseIndex}>
                  <td className="p-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'name', e.target.value)}
                      placeholder="Nome esercizio"
                      className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-black"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'sets', e.target.value)}
                      placeholder="3x12"
                      className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-black"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={exercise.videoUrl}
                      onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'videoUrl', e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-black"
                    >
                      <option value="">Seleziona un video</option>
                      {Object.entries(videoOptions).map(([name, url]) => (
                        <option key={name} value={url}>{name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => removeExercise(dayIndex, exerciseIndex)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button
            onClick={() => addExercise(dayIndex)}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            + Aggiungi Esercizio
          </button>
        </div>
      ))}

      {/* Pulsanti di azione */}
      <div className="flex gap-4">
        <button
          onClick={addDay}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          + Aggiungi Giorno
        </button>
        <button
          onClick={generatePDF}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Scarica PDF
        </button>
      </div>
    </div>
  );
};

export default WorkoutScheduleCreator;
