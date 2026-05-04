import { z } from "zod";
import type { PCQTemplate, PCQQuestion } from "@/types";

export const pcqTemplate: PCQTemplate = {
  sections: [
    {
      id: "general-information",
      title: "General Information",
      questions: [
        {
          id: "reasonForVisit",
          label: "What is the main reason for this consultation?",
          type: "text",
          required: true,
        },
        {
          id: "recentDiagnosisChanges",
          label: "Have there been any recent diagnosis updates?",
          type: "select",
          required: true,
          options: ["No changes", "New diagnosis", "Condition worsened", "Condition improved"],
        },
      ],
    },
    {
      id: "symptoms",
      title: "Symptoms",
      questions: [
        {
          id: "currentSymptoms",
          label: "Describe any symptoms you are experiencing",
          type: "textarea",
          required: true,
        },
        {
          id: "symptomsWorsening",
          label: "Have your symptoms worsened recently?",
          type: "boolean",
          required: false,
        },
      ],
    },
    {
      id: "current-condition",
      title: "Current Condition",
      questions: [
        {
          id: "currentMedications",
          label: "What medications are you currently taking?",
          type: "textarea",
          required: false,
        },
        {
          id: "glucoseControl",
          label: "How would you describe your glucose control this week?",
          type: "select",
          required: true,
          options: ["Stable", "Fluctuating", "Poor", "Unsure"],
        },
      ],
    },
    {
      id: "additional-notes",
      title: "Additional Notes",
      questions: [
        {
          id: "additionalNotes",
          label: "Anything else your provider should know before the consultation?",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
};

function createQuestionSchema(question: PCQQuestion) {
  if (question.type === "boolean") {
    return z.boolean().default(false);
  }

  if (question.required) {
    return z.string().trim().min(1, `${question.label} is required.`);
  }

  return z.string().optional().default("");
}

export const pcqFormSchema = z.object(
  Object.fromEntries(
    pcqTemplate.sections.flatMap((section) =>
      section.questions.map((question) => [question.id, createQuestionSchema(question)]),
    ),
  ),
);

export type PCQFormValues = z.input<typeof pcqFormSchema>;

export const pcqDefaultValues: PCQFormValues = Object.fromEntries(
  pcqTemplate.sections.flatMap((section) =>
    section.questions.map((question) => [question.id, question.type === "boolean" ? false : ""]),
  ),
) as PCQFormValues;
