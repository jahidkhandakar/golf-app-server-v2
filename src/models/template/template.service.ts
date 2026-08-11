import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Template } from "./template.model";

/** Save the current tournament settings as a named template for the creator. */
const saveTemplate = async (
  creatorId: string,
  payload: { templateName: string; settings: Record<string, unknown> },
) => {
  if (!payload.templateName?.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "templateName is required");
  }
  return Template.create({
    creator: creatorId,
    templateName: payload.templateName.trim(),
    settings: payload.settings ?? {},
  });
};

/** The creator's saved templates, newest first, for the picker. */
const getTemplates = async (creatorId: string) => {
  return Template.find({ creator: creatorId }).sort({ updatedAt: -1 });
};

/** Delete a template the caller owns. */
const deleteTemplate = async (id: string, creatorId: string) => {
  const template = await Template.findById(id);
  if (!template) {
    throw new AppError(StatusCodes.NOT_FOUND, "Template not found");
  }
  if (template.creator.toString() !== creatorId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only delete your own templates",
    );
  }
  await template.deleteOne();
  return { deleted: true };
};

export const TemplateService = {
  saveTemplate,
  getTemplates,
  deleteTemplate,
};
