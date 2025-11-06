import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/form/date-time-picker'
import { ColorPicker } from '@/components/form/color-picker'
import { useCalendarContext } from '../calendar-context'
import { normalizeCalendarColor } from '@/components/calendar/calendar-tailwind-classes'

const formSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    start: z.string().datetime(),
    end: z.string().datetime(),
    color: z.string(),
    applicationId: z.string().min(1, 'Application is required'),
    description: z
      .string()
      .max(1000, 'Description must be 1000 characters or less')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start)
      const end = new Date(data.end)
      return end >= start
    },
    {
      message: 'End time must be after start time',
      path: ['end'],
    }
  )

export default function CalendarNewEventDialog() {
  const {
    newEventDialogOpen,
    setNewEventDialogOpen,
    date,
    applications,
    createEvent,
    isLoading = false,
  } = useCalendarContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultApplicationId = useMemo(
    () => applications[0]?.id ?? '',
    [applications]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      start: format(date, "yyyy-MM-dd'T'HH:mm"),
      end: format(date, "yyyy-MM-dd'T'HH:mm"),
      color: 'blue',
      applicationId: defaultApplicationId,
      description: '',
    },
  })

  useEffect(() => {
    if (newEventDialogOpen) {
      const formatted = format(date, "yyyy-MM-dd'T'HH:mm")
      form.reset({
        title: '',
        start: formatted,
        end: formatted,
        color: 'blue',
        applicationId: defaultApplicationId,
        description: '',
      })
    }
  }, [newEventDialogOpen, date, defaultApplicationId, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!applications.length) {
      toast.error('You need to create an application before scheduling meetings.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: values.title.trim(),
        start: new Date(values.start),
        end: new Date(values.end),
        color: normalizeCalendarColor(values.color),
        applicationId: values.applicationId,
        description:
          values.description && values.description.length > 0
            ? values.description
            : null,
      }

      await createEvent(payload)
      toast.success('Meeting created.')
      setNewEventDialogOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create meeting.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const disableSubmit = isSubmitting || isLoading || !applications.length

  return (
    <Dialog open={newEventDialogOpen} onOpenChange={setNewEventDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Start</FormLabel>
                  <FormControl>
                    <DateTimePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">End</FormLabel>
                  <FormControl>
                    <DateTimePicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Application</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!applications.length || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {applications.map((application) => (
                        <SelectItem
                          key={application.id}
                          value={application.id}
                        >
                          {application.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Color</FormLabel>
                  <FormControl>
                    <ColorPicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description (max 1000 characters)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!applications.length && (
              <p className="text-sm text-muted-foreground">
                Create an application first to attach your meeting.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={disableSubmit}>
                {isSubmitting ? 'Creating...' : 'Create meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
