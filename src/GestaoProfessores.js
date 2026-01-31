import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ESTILOS } from "./styles";

export default function GestaoProfessores({ professores, setProfessores }) {
  const [novoProfNome, setNovoProfNome] = useState("");

  const adicionarProfessor = () => {
    if (!novoProfNome.trim()) return alert("Digite um nome!");
    setProfessores([
      ...professores,
      { id: Date.now(), nome: novoProfNome, disponibilidade: [] },
    ]);
    setNovoProfNome("");
  };

  return (
    <>
      <div style={ESTILOS.aviso}>
        <strong>Disponibilidade:</strong> Selecione o professor na lista e
        clique nos dias do calendário para marcar quando ele{" "}
        <strong>PODE</strong> dar aula (ficará verde).
      </div>

      {/* Formulário de cadastro substituindo o prompt */}
      <div style={ESTILOS.controlBar}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          <input
            type="text"
            placeholder="Nome do professor"
            value={novoProfNome}
            onChange={(e) => setNovoProfNome(e.target.value)}
            style={{ ...ESTILOS.input, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && adicionarProfessor()}
          />
          <button onClick={adicionarProfessor} style={ESTILOS.btnAcao}>
            + Salvar
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {professores.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", color: "#334155" }}>
                {p.nome}
              </h3>
              <button
                onClick={() =>
                  setProfessores((prev) => prev.filter((x) => x.id !== p.id))
                }
                style={{
                  ...ESTILOS.btnAcao,
                  backgroundColor: "#ef4444",
                  fontSize: "10px",
                  padding: "4px 8px",
                }}
              >
                Excluir
              </button>
            </div>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              height="auto"
              headerToolbar={{
                left: "title",
                center: "",
                right: "prev,next",
              }}
              dateClick={(info) => {
                setProfessores((prev) =>
                  prev.map((prof) =>
                    prof.id === p.id
                      ? {
                          ...prof,
                          disponibilidade: prof.disponibilidade.includes(
                            info.dateStr
                          )
                            ? prof.disponibilidade.filter(
                                (d) => d !== info.dateStr
                              )
                            : [...prof.disponibilidade, info.dateStr],
                        }
                      : prof
                  )
                );
              }}
              events={p.disponibilidade.map((d) => ({
                display: "background",
                date: d,
                color: "#22c55e",
              }))}
            />
          </div>
        ))}
      </div>
    </>
  );
}
