"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import VIDEO_OPTIONS from "./data/esercizi";
import Image from "next/image";

// Video options with expanded keywords for better filtering

const WorkoutScheduleCreator = () => {
  const [isClient, setIsClient] = useState(false);
  const [schedule, setSchedule] = useState({
    title: "",
    startDate: "",
    days: [
      {
        name: "Day 1",
        exercises: [{ name: "", sets: "", restMinutes: "", videoUrl: "" }],
      },
    ],
  });

  // Ensure date is only set on client-side to prevent hydration errors
  useEffect(() => {
    setSchedule((prev) => ({
      ...prev,
      startDate: new Date().toISOString().split("T")[0],
    }));
    setIsClient(true);
  }, []);

  // Filter video options based on exercise name
  const filterVideoOptions = (exerciseName) => {
    if (!exerciseName) return VIDEO_OPTIONS;

    const normalizedName = exerciseName.toLowerCase();
    return Object.fromEntries(
      Object.entries(VIDEO_OPTIONS).filter(([name, url]) =>
        name.toLowerCase().includes(normalizedName)
      )
    );
  };

  // Day management functions
  const addDay = () => {
    setSchedule((prev) => ({
      ...prev,
      days: [
        ...prev.days,
        {
          name: `Day ${prev.days.length + 1}`,
          exercises: [{ name: "", sets: "", restMinutes: "", videoUrl: "" }],
        },
      ],
    }));
  };

  const addExercise = (dayIndex) => {
    setSchedule((prev) => {
      const newDays = [...prev.days];
      const lastExercise =
        newDays[dayIndex].exercises[newDays[dayIndex].exercises.length - 1];

      if (!lastExercise || lastExercise.name !== "") {
        newDays[dayIndex].exercises.push({
          name: "",
          sets: "",
          restMinutes: "",
          videoUrl: "",
        });
      }

      return { ...prev, days: newDays };
    });
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    setSchedule((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex].exercises.splice(exerciseIndex, 1);
      return { ...prev, days: newDays };
    });
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setSchedule((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex].exercises[exerciseIndex][field] = value;
      return { ...prev, days: newDays };
    });
  };

  // PDF Generation Function
  const generatePDF = () => {
    const pdf = new jsPDF();

    const logoUrl = "/img/logo.jpg";

    const addLogo = (pdf) => {
      try {
        const logoWidth = 60;
        const logoHeight = 35;
        const pageWidth = pdf.internal.pageSize.width;
        const x = (pageWidth - logoWidth) / 2;
        const y = 10;

        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.height, "F");

        pdf.addImage(logoUrl, "PNG", x, y, logoWidth, logoHeight);
        return logoHeight + 15;
      } catch (error) {
        console.error("Errore nell'aggiunta del logo:", error);
        return 20;
      }
    };

    let yOffset = addLogo(pdf);

    pdf.setTextColor(255, 255, 255);

    pdf.setFontSize(20);
    pdf.text(schedule.title || "Scheda Allenamento", 20, yOffset);

    pdf.setFontSize(12);
    pdf.text(
      `Data inizio: ${new Date(schedule.startDate).toLocaleDateString()}`,
      20,
      yOffset + 10
    );

    yOffset += 40;

    schedule.days.forEach((day) => {
      pdf.setFontSize(16);
      const dayNameWidth = pdf.getTextWidth(day.name);
      pdf.text(
        day.name,
        (pdf.internal.pageSize.width - dayNameWidth) / 2,
        yOffset
      );

      const tableData = day.exercises.map((ex) => [
        ex.name,
        ex.sets,
        ex.restMinutes,
        ex.videoUrl,
      ]);

      autoTable(pdf, {
        head: [["Esercizio", "Serie", "Riposo", "Video"]],
        body: tableData,
        startY: yOffset + 10,
        margin: { left: 20 },
        theme: "grid",
        styles: {
          fontSize: 12,
          cellPadding: 3,
          textColor: [255, 255, 255],
          fillColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [241, 64, 0],
          textColor: [255, 255, 255],
          halign: "center",
        },
        borderColor: [255, 255, 255],
        didParseCell: (data) => {
          if (
            data.cell.raw &&
            typeof data.cell.raw === "string" &&
            data.cell.raw.startsWith("http")
          ) {
            const url = data.cell.raw;
            const cell = data.cell;
            const x = cell.x + cell.width / 2;
            const y = cell.y + cell.height / 2;
            pdf.link(x, y, cell.width, cell.height, { url });
          }
        },
      });

      yOffset = pdf.lastAutoTable.finalY + 20;

      if (yOffset > 350) {
        pdf.addPage();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        yOffset = 20;
      }
    });

    pdf.save("scheda-allenamento.pdf");
  };

  // Render only when client-side
  if (!isClient) {
    return null;
  }

  return (
    <>
      <div className="p-4 max-w-4xl mx-auto ">
        {/* Header con titolo e data */}
        <div className="bg-black100 shadow rounded-lg p-6 mb-6">
          <input
            type="text"
            placeholder="Titolo della scheda"
            value={schedule.title}
            onChange={(e) =>
              setSchedule((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full text-xl font-bold border-b-2 border-white focus:border-orange-600 text-white bg-transparent focus:outline-none placeholder:text-white"
          />
          <input
            type="date"
            value={schedule.startDate}
            onChange={(e) =>
              setSchedule((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="mt-2 w-full p-2 border rounded text-black bg-slate-100"
          />
        </div>

        {/* Giorni di allenamento */}
        {schedule.days.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className="bg-black100 shadow rounded-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-white">
              {day.name}
            </h2>

            <div
              className="overflow-x-auto pb-2 
              [&::-webkit-scrollbar]:w-3 
              [&::-webkit-scrollbar]:bg-black200
              [&::-webkit-scrollbar]:rounded-full
              [&::-webkit-scrollbar-thumb]:rounded-full 
              [&::-webkit-scrollbar-thumb]:bg-orange-800
              [&::-webkit-scrollbar-track]:bg-transparent"
            >
              <table className="w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b bg-orange-600 text-white">
                      Esercizio
                    </th>
                    <th className="text-left p-2 border-b bg-orange-600 text-white">
                      Serie
                    </th>
                    <th className="text-left p-2 border-b bg-orange-600 text-white">
                      Minuti Riposo
                    </th>
                    <th className="text-left p-2 border-b bg-orange-600 text-white">
                      Video URL
                    </th>
                    <th className="w-20 border-b bg-orange-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((exercise, exerciseIndex) => {
                    // Filtra le opzioni video in base al nome dell'esercizio
                    const filteredVideoOptions = filterVideoOptions(
                      exercise.name
                    );

                    return (
                      <tr key={exerciseIndex}>
                        <td className="pE-2">
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(e) =>
                              updateExercise(
                                dayIndex,
                                exerciseIndex,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Nome esercizio"
                            className="w-full p-2 border rounded focus:outline-none focus:border-orange-600 text-white bg-transparent"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exercise.sets}
                            onChange={(e) =>
                              updateExercise(
                                dayIndex,
                                exerciseIndex,
                                "sets",
                                e.target.value
                              )
                            }
                            placeholder="3x12"
                            className="w-full p-2 border rounded focus:outline-none focus:border-orange-600 text-white bg-transparent"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={exercise.restMinutes}
                            onChange={(e) =>
                              updateExercise(
                                dayIndex,
                                exerciseIndex,
                                "restMinutes",
                                e.target.value
                              )
                            }
                            placeholder="Minuti riposo"
                            className="w-full p-2 border rounded focus:outline-none focus:border-orange-600 text-white bg-transparent"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={exercise.videoUrl}
                            onChange={(e) =>
                              updateExercise(
                                dayIndex,
                                exerciseIndex,
                                "videoUrl",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded focus:outline-none focus:border-orange-600 text-white bg-transparent"
                          >
                            <option className="bg-black100" value="">
                              Seleziona un video
                            </option>
                            {Object.entries(filteredVideoOptions).map(
                              ([name, url]) => (
                                <option
                                  className="bg-black100"
                                  key={name}
                                  value={url}
                                >
                                  {name}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() =>
                              removeExercise(dayIndex, exerciseIndex)
                            }
                            className="p-2 text-red-500 hover:scale-150 rounded text-xl text-center"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => addExercise(dayIndex)}
              className="mt-4 px-4 py-2 hover:text-orange-600 text-white rounded-3xl"
            >
              + Aggiungi Esercizio
            </button>
          </div>
        ))}

        {/* Pulsanti di azione */}
        <div className="flex gap-4">
          <button
            onClick={addDay}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-300 text-black rounded-3xl"
          >
            + Aggiungi Giorno
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-800 text-white rounded-3xl"
          >
            Scarica PDF
          </button>
        </div>
      </div>
    </>
  );
};

export default WorkoutScheduleCreator;
